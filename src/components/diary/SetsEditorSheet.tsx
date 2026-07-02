import { useState } from 'react';
import type { AppData, Metric, SetRecord } from '../../types';
import { actions, lastSetsFor } from '../../store';
import { Sheet } from '../ui/Sheet';
import { ActionSheet, type SheetAction } from '../ui/ActionSheet';
import { NumberInput } from '../ui/NumberInput';
import { Icon } from '../ui/Icons';
import { StatsSheet } from './StatsSheet';
import { formatSet } from '../../lib/stats';
import { formatDayFull } from '../../lib/dates';

interface Props {
  open: boolean;
  onClose: () => void;
  workoutId: string | null;
  entryId: string | null;
  data: AppData;
}

interface Field {
  key: keyof SetRecord;
  header: string;
  decimal: boolean;
  suffix?: string;
}

function fieldsFor(metric: Metric, doubled: boolean): Field[] {
  if (metric === 'time') return [{ key: 'timeMin', header: 'время', decimal: true }];
  if (metric === 'time-distance') {
    return [
      { key: 'distanceKm', header: 'дистанция, км', decimal: true },
      { key: 'timeMin', header: 'время, мин', decimal: true }
    ];
  }
  return [
    { key: 'weight', header: 'вес', decimal: true, suffix: doubled ? '×2' : undefined },
    { key: 'reps', header: 'повторы', decimal: false }
  ];
}

export function SetsEditorSheet({ open, onClose, workoutId, entryId, data }: Props) {
  const [statsOpen, setStatsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const workout = data.workouts.find((w) => w.id === workoutId) ?? null;
  const entry = workout?.entries.find((e) => e.id === entryId) ?? null;
  const exercise = entry ? data.exercises.find((x) => x.id === entry.exerciseId) ?? null : null;

  const last =
    workout && entry ? lastSetsFor(data, entry.exerciseId, workout.date, workout.id) : null;

  let menuActions: SheetAction[] = [];
  if (workout && entry) {
    const idx = workout.entries.findIndex((e) => e.id === entry.id);
    const next = workout.entries[idx + 1];
    menuActions = [
      ...(next
        ? [
            {
              label:
                entry.supersetId && entry.supersetId === next.supersetId
                  ? 'Разорвать суперсет'
                  : 'Суперсет со следующим',
              onClick: () => actions.toggleSupersetWithNext(workout.id, entry.id)
            }
          ]
        : []),
      ...(idx > 0
        ? [{ label: 'Переместить выше', onClick: () => actions.moveEntry(workout.id, entry.id, -1) }]
        : []),
      ...(idx < workout.entries.length - 1
        ? [{ label: 'Переместить ниже', onClick: () => actions.moveEntry(workout.id, entry.id, 1) }]
        : []),
      {
        label: 'Убрать из тренировки',
        danger: true,
        onClick: () => {
          actions.removeEntry(workout.id, entry.id);
          onClose();
        }
      }
    ];
  }

  const fields = exercise ? fieldsFor(exercise.metric, exercise.doubled) : [];

  return (
    <>
      <Sheet open={open && !!entry} onClose={onClose}>
        {workout && entry && exercise && (
          <>
            <div className="editor-head">
              <div className="sheet-title">{exercise.name}</div>
              <button className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="Меню">
                <Icon name="ellipsis" />
              </button>
            </div>

            {entry.sets.length > 0 && (
              <div className="set-grid-head">
                <span className="set-idx" />
                {fields.map((f) => (
                  <span key={f.key} className="set-col-label">
                    {f.header}
                  </span>
                ))}
                <span className="set-del-space" />
              </div>
            )}

            {entry.sets.map((s, i) => (
              <div className="set-row" key={i}>
                <span className="set-idx">{i + 1}</span>
                {fields.map((f) => (
                  <NumberInput
                    key={f.key}
                    value={s[f.key]}
                    decimal={f.decimal}
                    suffix={f.suffix}
                    ariaLabel={f.header}
                    onChange={(v) => actions.updateSet(workout.id, entry.id, i, { [f.key]: v })}
                  />
                ))}
                <button
                  className="set-del"
                  aria-label="Удалить подход"
                  onClick={() => actions.removeSet(workout.id, entry.id, i)}
                >
                  <Icon name="close" size={15} />
                </button>
              </div>
            ))}

            {entry.sets.length === 0 && last && (
              <div className="last-hint">
                <div className="last-hint-date">В прошлый раз · {formatDayFull(last.date)}</div>
                <div className="last-hint-sets">
                  {last.sets.map((s) => formatSet(s, exercise)).join('  ·  ')}
                </div>
                <button
                  className="btn-primary"
                  onClick={() => actions.fillFromLast(workout.id, entry.id)}
                >
                  Повторить прошлые подходы
                </button>
              </div>
            )}

            <div className="set-row">
              <span className="set-idx">{entry.sets.length + 1}</span>
              <button className="add-set-btn" onClick={() => actions.addSet(workout.id, entry.id)}>
                Добавить подход
              </button>
              <span className="set-del-space" />
            </div>

            <div className="editor-footer">
              <button
                className="round-btn"
                aria-label="Статистика"
                onClick={() => setStatsOpen(true)}
              >
                <Icon name="chart" />
              </button>
              <button className="btn-primary grow" onClick={onClose}>
                Готово
              </button>
            </div>
          </>
        )}
      </Sheet>

      <ActionSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={exercise?.name}
        actions={menuActions}
      />
      <StatsSheet
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        exercise={exercise}
        data={data}
      />
    </>
  );
}

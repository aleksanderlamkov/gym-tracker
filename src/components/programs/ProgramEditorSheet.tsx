import { useEffect, useMemo, useState } from 'react';
import type { AppData, Program, ProgramEntry } from '../../types';
import { actions } from '../../store';
import { Sheet } from '../ui/Sheet';
import { ActionSheet } from '../ui/ActionSheet';
import { CategoryBadge, Icon } from '../ui/Icons';
import { ExercisePickerSheet } from '../exercises/ExercisePickerSheet';
import { id } from '../../lib/id';

interface Props {
  open: boolean;
  onClose: () => void;
  /** null — создание новой */
  program: Program | null;
  data: AppData;
}

export function ProgramEditorSheet({ open, onClose, program, data }: Props) {
  const [name, setName] = useState('');
  const [entries, setEntries] = useState<ProgramEntry[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setName(program?.name ?? '');
      setEntries(program?.entries.map((e) => ({ ...e })) ?? []);
    }
  }, [open, program]);

  const exById = useMemo(
    () => new Map(data.exercises.map((e) => [e.id, e])),
    [data.exercises]
  );

  const move = (i: number, dir: -1 | 1) => {
    const to = i + dir;
    if (to < 0 || to >= entries.length) return;
    const next = [...entries];
    const [item] = next.splice(i, 1);
    next.splice(to, 0, item);
    setEntries(next);
  };

  const remove = (i: number) => setEntries(entries.filter((_, idx) => idx !== i));

  const toggleSS = (i: number) => {
    if (i >= entries.length - 1) return;
    const next = entries.map((e) => ({ ...e }));
    const cur = next[i];
    const nxt = next[i + 1];
    if (cur.supersetId && cur.supersetId === nxt.supersetId) {
      nxt.supersetId = undefined;
    } else {
      const sid = cur.supersetId ?? id();
      cur.supersetId = sid;
      nxt.supersetId = sid;
    }
    setEntries(next);
  };

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    actions.saveProgram({
      id: program?.id ?? id(),
      name: trimmed,
      description: program?.description,
      entries
    });
    onClose();
  };

  return (
    <>
      <Sheet open={open} onClose={onClose}>
        <div className="sheet-title">{program ? 'Программа' : 'Новая программа'}</div>

        <input
          className="text-input"
          placeholder="Название, например: Трёхдневка — низ (2/3)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="field-label">Упражнения</div>
        {entries.length === 0 && (
          <div className="stats-empty">Добавь упражнения — они будут появляться в тренировке в этом порядке</div>
        )}

        <div className="pe-list">
          {entries.map((e, i) => {
            const ex = exById.get(e.exerciseId);
            const linkedWithNext =
              i < entries.length - 1 &&
              !!e.supersetId &&
              e.supersetId === entries[i + 1].supersetId;
            return (
              <div key={e.id}>
                <div className={'pe-row' + (e.supersetId ? ' in-ss' : '')}>
                  <CategoryBadge category={ex?.category ?? 'other'} size={36} />
                  <span className="entry-name">{ex?.name ?? 'Удалённое упражнение'}</span>
                  <span className="pe-controls">
                    <button className="icon-btn" aria-label="Выше" disabled={i === 0} onClick={() => move(i, -1)}>
                      <Icon name="arrow-up" size={17} />
                    </button>
                    <button
                      className="icon-btn"
                      aria-label="Ниже"
                      disabled={i === entries.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      <Icon name="arrow-down" size={17} />
                    </button>
                    <button className="icon-btn" aria-label="Убрать" onClick={() => remove(i)}>
                      <Icon name="close" size={17} />
                    </button>
                  </span>
                </div>
                {i < entries.length - 1 && (
                  <button
                    className={'ss-link' + (linkedWithNext ? ' active' : '')}
                    onClick={() => toggleSS(i)}
                    title="Суперсет со следующим"
                  >
                    <Icon name="link" size={14} />
                    {linkedWithNext ? 'суперсет' : ''}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button className="btn-secondary" onClick={() => setPickerOpen(true)}>
          Добавить упражнение
        </button>

        <button
          className="btn-primary"
          style={{ marginTop: 14 }}
          onClick={save}
          disabled={!name.trim()}
        >
          Сохранить
        </button>

        {program && (
          <div className="editor-extra">
            <button className="btn-danger-text" onClick={() => setConfirmDelete(true)}>
              Удалить программу
            </button>
          </div>
        )}
      </Sheet>

      <ExercisePickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        data={data}
        onPick={(exerciseId) => {
          setEntries((prev) => [...prev, { id: id(), exerciseId }]);
          setPickerOpen(false);
        }}
      />

      {program && (
        <ActionSheet
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title={`Удалить программу «${program.name}»? Прошлые тренировки останутся.`}
          actions={[
            {
              label: 'Удалить',
              danger: true,
              onClick: () => {
                actions.deleteProgram(program.id);
                onClose();
              }
            }
          ]}
        />
      )}
    </>
  );
}

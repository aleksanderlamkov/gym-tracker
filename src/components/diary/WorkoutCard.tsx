import { useMemo, useState } from 'react';
import type { AppData, Workout, WorkoutEntry } from '../../types';
import { actions } from '../../store';
import { ActionSheet } from '../ui/ActionSheet';
import { PromptSheet } from '../ui/PromptSheet';
import { CategoryBadge, Icon } from '../ui/Icons';
import { ExercisePickerSheet } from '../exercises/ExercisePickerSheet';
import { formatSet } from '../../lib/stats';
import { exercisesPlural } from '../../lib/plural';

interface Props {
  workout: Workout;
  data: AppData;
  onOpenEntry: (workoutId: string, entryId: string) => void;
}

export function WorkoutCard({ workout, data, onOpenEntry }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const exById = useMemo(
    () => new Map(data.exercises.map((e) => [e.id, e])),
    [data.exercises]
  );

  // группировка последовательных упражнений одного суперсета
  const groups = useMemo(() => {
    const res: { ss: boolean; entries: WorkoutEntry[] }[] = [];
    for (const e of workout.entries) {
      const prev = res[res.length - 1];
      if (
        e.supersetId &&
        prev &&
        prev.ss &&
        prev.entries[prev.entries.length - 1].supersetId === e.supersetId
      ) {
        prev.entries.push(e);
      } else {
        res.push({ ss: !!e.supersetId, entries: [e] });
      }
    }
    return res;
  }, [workout.entries]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderEntry = (e: WorkoutEntry) => {
    const ex = exById.get(e.exerciseId);
    if (!ex) return null;
    const isOpen = expanded.has(e.id);
    return (
      <div key={e.id}>
        <div className="entry-row">
          <button className="entry-main" onClick={() => onOpenEntry(workout.id, e.id)}>
            <CategoryBadge category={ex.category} />
            <span className="entry-name">
              {ex.name}
              {ex.doubled && <em className="x2-chip">×2</em>}
            </span>
          </button>
          {e.sets.length > 0 && <span className="sets-chip">{e.sets.length}</span>}
          <button
            className={'chev-btn' + (isOpen ? ' open' : '')}
            aria-label={isOpen ? 'Свернуть' : 'Развернуть'}
            onClick={() => toggleExpand(e.id)}
          >
            <Icon name="chevron-down" size={20} />
          </button>
        </div>
        {isOpen && (
          <div className="mini-sets">
            {e.sets.length === 0 && <div className="mini-set empty">Подходы не записаны</div>}
            {e.sets.map((s, i) => (
              <div key={i} className="mini-set">
                <span className="mini-idx">{i + 1}</span>
                <span>{formatSet(s, ex)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="workout-card">
      <div className="workout-head">
        <span className="workout-name">{workout.name || 'Тренировка'}</span>
        <div className="workout-head-right">
          <span className="workout-count">{workout.entries.length}</span>
          <button
            className="icon-btn light"
            aria-label="Меню тренировки"
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="ellipsis" />
          </button>
        </div>
      </div>

      {workout.entries.length > 0 ? (
        <div className="entries-card">
          {groups.map((g, gi) =>
            g.ss ? (
              <div key={gi} className="ss-group">
                <div className="ss-label">
                  <Icon name="link" size={12} /> Суперсет
                </div>
                {g.entries.map(renderEntry)}
              </div>
            ) : (
              g.entries.map(renderEntry)
            )
          )}
        </div>
      ) : (
        <div className="entries-card empty-entries">
          <span>Нет упражнений</span>
          <button className="btn-small" onClick={() => setPickerOpen(true)}>
            Добавить
          </button>
        </div>
      )}

      <ActionSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={workout.name || 'Тренировка'}
        actions={[
          { label: 'Добавить упражнение', onClick: () => setPickerOpen(true) },
          { label: 'Переименовать', onClick: () => setRenameOpen(true) },
          { label: 'Удалить тренировку', danger: true, onClick: () => setConfirmDelete(true) }
        ]}
      />
      <ActionSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={`Удалить тренировку${workout.name ? ` «${workout.name}»` : ''}? Записанные подходы пропадут.`}
        actions={[
          { label: 'Удалить', danger: true, onClick: () => actions.deleteWorkout(workout.id) }
        ]}
      />
      <PromptSheet
        open={renameOpen}
        onClose={() => setRenameOpen(false)}
        title="Название тренировки"
        initial={workout.name}
        placeholder="Например: День ног"
        onSave={(v) => actions.renameWorkout(workout.id, v)}
      />
      <ExercisePickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        data={data}
        subtitle={exercisesPlural(workout.entries.length)}
        onPick={(exerciseId) => {
          actions.addEntry(workout.id, exerciseId);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}

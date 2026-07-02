import { useEffect, useState } from 'react';
import type { AppData, CategoryId, Exercise, Metric } from '../../types';
import { CATEGORIES } from '../../types';
import { actions } from '../../store';
import { Sheet } from '../ui/Sheet';
import { ActionSheet } from '../ui/ActionSheet';
import { Segmented } from '../ui/Segmented';
import { StatsSheet } from '../diary/StatsSheet';
import { id } from '../../lib/id';
import { showToast } from '../ui/toast';

const METRICS: { id: Metric; name: string }[] = [
  { id: 'weight-reps', name: 'Вес × повторы' },
  { id: 'time', name: 'Время' },
  { id: 'time-distance', name: 'Кардио' }
];

interface Props {
  open: boolean;
  onClose: () => void;
  /** null — создание нового */
  exercise: Exercise | null;
  data: AppData;
  onSaved?: (exerciseId: string) => void;
}

export function ExerciseEditorSheet({ open, onClose, exercise, data, onSaved }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryId>('other');
  const [metric, setMetric] = useState<Metric>('weight-reps');
  const [doubled, setDoubled] = useState(false);
  const [bodyweight, setBodyweight] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setName(exercise?.name ?? '');
      setCategory(exercise?.category ?? 'other');
      setMetric(exercise?.metric ?? 'weight-reps');
      setDoubled(exercise?.doubled ?? false);
      setBodyweight(exercise?.bodyweight ?? false);
    }
  }, [open, exercise]);

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const ex: Exercise = {
      id: exercise?.id ?? id(),
      name: trimmed,
      category,
      metric,
      doubled: metric === 'weight-reps' ? doubled : false,
      bodyweight: metric === 'weight-reps' ? bodyweight : false,
      archived: exercise?.archived
    };
    actions.saveExercise(ex);
    onSaved?.(ex.id);
    onClose();
  };

  return (
    <>
      <Sheet open={open} onClose={onClose}>
        <div className="sheet-title">{exercise ? 'Упражнение' : 'Новое упражнение'}</div>

        <input
          className="text-input"
          placeholder="Название"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="field-label">Группа мышц</div>
        <div className="cat-grid">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={'cat-option' + (category === c.id ? ' active' : '')}
              onClick={() => setCategory(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="field-label">Что записываем</div>
        <Segmented options={METRICS} value={metric} onChange={setMetric} />

        {metric === 'weight-reps' && (
          <div className="toggles">
            <label className="toggle-row">
              <span>
                Вес на каждую руку <em className="x2-chip">×2</em>
                <span className="toggle-hint">гантели: тоннаж считается вдвое</span>
              </span>
              <input
                type="checkbox"
                checked={doubled}
                onChange={(e) => setDoubled(e.target.checked)}
              />
            </label>
            <label className="toggle-row">
              <span>
                Свой вес
                <span className="toggle-hint">вес в подходе — только добавочный</span>
              </span>
              <input
                type="checkbox"
                checked={bodyweight}
                onChange={(e) => setBodyweight(e.target.checked)}
              />
            </label>
          </div>
        )}

        <button className="btn-primary" style={{ marginTop: 18 }} onClick={save} disabled={!name.trim()}>
          Сохранить
        </button>

        {exercise && (
          <div className="editor-extra">
            <button className="btn-secondary" onClick={() => setStatsOpen(true)}>
              Статистика
            </button>
            <button className="btn-danger-text" onClick={() => setConfirmDelete(true)}>
              Удалить упражнение
            </button>
          </div>
        )}
      </Sheet>

      {exercise && (
        <>
          <ActionSheet
            open={confirmDelete}
            onClose={() => setConfirmDelete(false)}
            title={`Удалить «${exercise.name}»? Если по нему есть история, оно попадёт в архив, а записи сохранятся.`}
            actions={[
              {
                label: 'Удалить',
                danger: true,
                onClick: () => {
                  const removed = actions.deleteOrArchiveExercise(exercise.id);
                  showToast(removed ? 'Упражнение удалено' : 'Упражнение в архиве');
                  onClose();
                }
              }
            ]}
          />
          <StatsSheet
            open={statsOpen}
            onClose={() => setStatsOpen(false)}
            exercise={exercise}
            data={data}
          />
        </>
      )}
    </>
  );
}

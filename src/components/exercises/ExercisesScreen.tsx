import { useMemo, useState } from 'react';
import type { AppData, Exercise } from '../../types';
import { CATEGORIES } from '../../types';
import { actions } from '../../store';
import { CategoryBadge, Icon } from '../ui/Icons';
import { ExerciseEditorSheet } from './ExerciseEditorSheet';
import { workoutsPlural } from '../../lib/plural';

interface Props {
  data: AppData;
}

export function ExercisesScreen({ data }: Props) {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [creating, setCreating] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  const usage = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of data.workouts) {
      const seen = new Set<string>();
      for (const e of w.entries) {
        if (!seen.has(e.exerciseId)) {
          seen.add(e.exerciseId);
          map.set(e.exerciseId, (map.get(e.exerciseId) ?? 0) + 1);
        }
      }
    }
    return map;
  }, [data.workouts]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = data.exercises.filter(
      (e) => !e.archived && (!q || e.name.toLowerCase().includes(q))
    );
    return CATEGORIES.map((c) => ({
      category: c,
      items: list
        .filter((e) => e.category === c.id)
        .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
    })).filter((g) => g.items.length > 0);
  }, [data.exercises, query]);

  const archived = useMemo(() => data.exercises.filter((e) => e.archived), [data.exercises]);

  return (
    <div className="screen">
      <header className="screen-head">
        <h1>Упражнения</h1>
      </header>

      <input
        className="text-input"
        placeholder="Поиск…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {grouped.length === 0 && (
        <div className="empty-state small">
          <p className="empty-text">
            {data.exercises.length === 0
              ? 'Упражнений пока нет — создай первое или импортируй бэкап'
              : 'Ничего не найдено'}
          </p>
        </div>
      )}

      {grouped.map((g) => (
        <div key={g.category.id} className="list-section">
          <div className="list-section-title">{g.category.name}</div>
          <div className="list-card">
            {g.items.map((e) => {
              const n = usage.get(e.id) ?? 0;
              return (
                <button key={e.id} className="list-row" onClick={() => setEditing(e)}>
                  <CategoryBadge category={e.category} size={38} />
                  <span className="list-row-text">
                    <span className="entry-name">
                      {e.name}
                      {e.doubled && <em className="x2-chip">×2</em>}
                    </span>
                    {n > 0 && <span className="list-row-sub">{workoutsPlural(n)}</span>}
                  </span>
                  <Icon name="chevron-right" size={18} />
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {archived.length > 0 && (
        <div className="list-section">
          <button className="archive-toggle" onClick={() => setShowArchive(!showArchive)}>
            Архив ({archived.length})
            <Icon name={showArchive ? 'chevron-down' : 'chevron-right'} size={16} />
          </button>
          {showArchive && (
            <div className="list-card">
              {archived.map((e) => (
                <div key={e.id} className="list-row static">
                  <CategoryBadge category={e.category} size={38} />
                  <span className="list-row-text">
                    <span className="entry-name muted">{e.name}</span>
                  </span>
                  <button className="btn-small" onClick={() => actions.restoreExercise(e.id)}>
                    Вернуть
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button className="fab" aria-label="Создать упражнение" onClick={() => setCreating(true)}>
        <Icon name="plus" size={28} />
      </button>

      <ExerciseEditorSheet
        open={!!editing}
        onClose={() => setEditing(null)}
        exercise={editing}
        data={data}
      />
      <ExerciseEditorSheet
        open={creating}
        onClose={() => setCreating(false)}
        exercise={null}
        data={data}
      />
    </div>
  );
}

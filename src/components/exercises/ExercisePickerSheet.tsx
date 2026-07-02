import { useMemo, useState } from 'react';
import type { AppData } from '../../types';
import { CATEGORIES } from '../../types';
import { Sheet } from '../ui/Sheet';
import { CategoryBadge } from '../ui/Icons';
import { ExerciseEditorSheet } from './ExerciseEditorSheet';

interface Props {
  open: boolean;
  onClose: () => void;
  data: AppData;
  onPick: (exerciseId: string) => void;
  subtitle?: string;
}

export function ExercisePickerSheet({ open, onClose, data, onPick, subtitle }: Props) {
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

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

  return (
    <>
      <Sheet open={open} onClose={onClose}>
        <div className="sheet-title">Выбор упражнения</div>
        {subtitle && <div className="sheet-subtitle">{subtitle}</div>}
        <input
          className="text-input"
          placeholder="Поиск…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {grouped.length === 0 && (
          <div className="stats-empty">
            {data.exercises.length === 0 ? 'Упражнений пока нет' : 'Ничего не найдено'}
          </div>
        )}

        {grouped.map((g) => (
          <div key={g.category.id} className="picker-group">
            <div className="picker-group-title">{g.category.name}</div>
            {g.items.map((e) => (
              <button key={e.id} className="picker-row" onClick={() => onPick(e.id)}>
                <CategoryBadge category={e.category} size={36} />
                <span className="entry-name">
                  {e.name}
                  {e.doubled && <em className="x2-chip">×2</em>}
                </span>
              </button>
            ))}
          </div>
        ))}

        <button className="btn-secondary" style={{ marginTop: 14 }} onClick={() => setCreateOpen(true)}>
          Создать упражнение
        </button>
      </Sheet>

      <ExerciseEditorSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        exercise={null}
        data={data}
        onSaved={(id) => {
          setCreateOpen(false);
          onPick(id);
        }}
      />
    </>
  );
}

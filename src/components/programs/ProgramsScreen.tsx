import { useState } from 'react';
import type { AppData, Program } from '../../types';
import { Icon } from '../ui/Icons';
import { ProgramEditorSheet } from './ProgramEditorSheet';
import { exercisesPlural } from '../../lib/plural';

interface Props {
  data: AppData;
}

export function ProgramsScreen({ data }: Props) {
  const [editing, setEditing] = useState<Program | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="screen">
      <header className="screen-head">
        <h1>Программы</h1>
      </header>

      {data.programs.length === 0 && (
        <div className="empty-state small">
          <p className="empty-text">
            Программа — это готовый список упражнений на один тренировочный день. Собери её один
            раз, и тренировка будет добавляться в один тап.
          </p>
        </div>
      )}

      <div className="programs-list">
        {data.programs.map((p) => (
          <button key={p.id} className="program-card" onClick={() => setEditing(p)}>
            <span className="program-card-badge">{p.entries.length}</span>
            <span className="program-card-text">
              <span className="program-card-name">{p.name}</span>
              <span className="program-card-sub">{exercisesPlural(p.entries.length)}</span>
            </span>
            <Icon name="chevron-right" size={18} />
          </button>
        ))}
      </div>

      <button className="fab" aria-label="Создать программу" onClick={() => setCreating(true)}>
        <Icon name="plus" size={28} />
      </button>

      <ProgramEditorSheet
        open={!!editing}
        onClose={() => setEditing(null)}
        program={editing}
        data={data}
      />
      <ProgramEditorSheet
        open={creating}
        onClose={() => setCreating(false)}
        program={null}
        data={data}
      />
    </div>
  );
}

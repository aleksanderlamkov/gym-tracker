import type { AppData } from '../../types';
import { actions } from '../../store';
import { Sheet } from '../ui/Sheet';
import { Icon } from '../ui/Icons';
import { exercisesPlural } from '../../lib/plural';
import { formatDayFull } from '../../lib/dates';

interface Props {
  open: boolean;
  onClose: () => void;
  date: string;
  data: AppData;
  onGoPrograms: () => void;
}

export function AddWorkoutSheet({ open, onClose, date, data, onGoPrograms }: Props) {
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="sheet-title">Тренировка · {formatDayFull(date)}</div>

      {data.programs.length === 0 && (
        <div className="add-empty">
          <p>Пока нет ни одной программы. Создай программу — и тренировка будет добавляться в один тап.</p>
          <button
            className="btn-primary"
            onClick={() => {
              onClose();
              onGoPrograms();
            }}
          >
            Создать программу
          </button>
        </div>
      )}

      <div className="program-pick-list">
        {data.programs.map((p) => (
          <button
            key={p.id}
            className="program-pick"
            onClick={() => {
              actions.addWorkoutFromProgram(date, p.id);
              onClose();
            }}
          >
            <span className="program-pick-badge">{p.entries.length}</span>
            <span className="program-pick-text">
              <span className="program-pick-name">{p.name}</span>
              <span className="program-pick-sub">{exercisesPlural(p.entries.length)}</span>
            </span>
            <Icon name="chevron-right" size={18} />
          </button>
        ))}

        <button
          className="program-pick ghost"
          onClick={() => {
            actions.addEmptyWorkout(date);
            onClose();
          }}
        >
          <span className="program-pick-badge plus">
            <Icon name="plus" size={18} />
          </span>
          <span className="program-pick-text">
            <span className="program-pick-name">Пустая тренировка</span>
            <span className="program-pick-sub">добавить упражнения вручную</span>
          </span>
        </button>
      </div>
    </Sheet>
  );
}

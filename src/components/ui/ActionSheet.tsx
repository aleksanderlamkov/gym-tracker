import { Sheet } from './Sheet';

export interface SheetAction {
  label: string;
  danger?: boolean;
  onClick: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  actions: SheetAction[];
}

export function ActionSheet({ open, onClose, title, actions }: Props) {
  return (
    <Sheet open={open} onClose={onClose}>
      {title && <div className="as-title">{title}</div>}
      <div className="as-group">
        {actions.map((a, i) => (
          <button
            key={i}
            className={'as-action' + (a.danger ? ' danger' : '')}
            onClick={() => {
              onClose();
              a.onClick();
            }}
          >
            {a.label}
          </button>
        ))}
      </div>
      <button className="as-cancel" onClick={onClose}>
        Отмена
      </button>
    </Sheet>
  );
}

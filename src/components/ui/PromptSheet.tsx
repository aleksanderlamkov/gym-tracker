import { useEffect, useState } from 'react';
import { Sheet } from './Sheet';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  placeholder?: string;
  initial?: string;
  onSave: (value: string) => void;
}

export function PromptSheet({ open, onClose, title, placeholder, initial, onSave }: Props) {
  const [value, setValue] = useState(initial ?? '');
  useEffect(() => {
    if (open) setValue(initial ?? '');
  }, [open, initial]);

  const save = () => {
    onSave(value.trim());
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="sheet-title">{title}</div>
      <input
        className="text-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
        }}
        autoFocus
      />
      <button className="btn-primary" style={{ marginTop: 16 }} onClick={save}>
        Сохранить
      </button>
    </Sheet>
  );
}

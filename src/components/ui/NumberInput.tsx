import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  decimal?: boolean;
  placeholder?: string;
  /** серый суффикс внутри поля, например «×2» */
  suffix?: string;
  ariaLabel?: string;
}

const toDisplay = (v: number | undefined): string =>
  v === undefined ? '' : String(v).replace('.', ',');

export function NumberInput({ value, onChange, decimal, placeholder, suffix, ariaLabel }: Props) {
  const [text, setText] = useState(toDisplay(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(toDisplay(value));
  }, [value]);

  const clean = (raw: string): string => {
    let out = '';
    let sep = false;
    for (const ch of raw) {
      if (ch >= '0' && ch <= '9') out += ch;
      else if ((ch === '.' || ch === ',') && decimal && !sep && out.length > 0) {
        out += ',';
        sep = true;
      }
    }
    return out.slice(0, 7);
  };

  const input = (
    <input
      className="num-input"
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      enterKeyHint="done"
      placeholder={placeholder ?? '0'}
      value={text}
      aria-label={ariaLabel}
      onFocus={(e) => {
        focused.current = true;
        e.target.select();
      }}
      onBlur={() => {
        focused.current = false;
        setText(toDisplay(value));
      }}
      onChange={(e) => {
        const t = clean(e.target.value);
        setText(t);
        const n = parseFloat(t.replace(',', '.'));
        onChange(Number.isFinite(n) ? n : undefined);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      }}
    />
  );

  if (!suffix) return input;
  return (
    <span className="num-wrap">
      {input}
      <span className="num-suffix">{suffix}</span>
    </span>
  );
}

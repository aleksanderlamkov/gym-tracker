interface Props<T extends string> {
  options: { id: T; name: string }[];
  value: T;
  onChange: (v: T) => void;
}

export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={o.id === value}
          className={'segment' + (o.id === value ? ' active' : '')}
          onClick={() => onChange(o.id)}
        >
          {o.name}
        </button>
      ))}
    </div>
  );
}

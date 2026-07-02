import { useRef, useState } from 'react';
import { addDays, todayISO, weekDays, WEEKDAYS_SHORT } from '../../lib/dates';

interface Props {
  viewedMonday: string;
  selected: string;
  markers: Set<string>;
  onSelect: (iso: string) => void;
  onChangeWeek: (monday: string) => void;
}

export function WeekStrip({ viewedMonday, selected, markers, onSelect, onChangeWeek }: Props) {
  const [drag, setDrag] = useState(0);
  const [anim, setAnim] = useState<null | -1 | 0 | 1>(null); // -1 = к следующей неделе (сдвиг влево)
  const gesture = useRef<{ x: number; y: number; dragging: boolean } | null>(null);
  const suppressClick = useRef(false);
  const today = todayISO();

  const panes = [-7, 0, 7].map((off) => weekDays(addDays(viewedMonday, off)));

  const commit = (dir: -1 | 1) => {
    setAnim(dir);
    setTimeout(() => {
      onChangeWeek(addDays(viewedMonday, dir === -1 ? 7 : -7));
      setAnim(null);
      setDrag(0);
    }, 240);
  };

  const paneShift = anim === -1 ? '-66.666%' : anim === 1 ? '0%' : '-33.333%';
  const style = {
    transform:
      anim !== null
        ? `translateX(${paneShift})`
        : `translateX(calc(-33.333% + ${drag}px))`,
    transition: anim !== null || (drag === 0 && !gesture.current?.dragging) ? 'transform .24s ease' : 'none'
  };

  return (
    <div
      className="week-strip"
      onPointerDown={(e) => {
        if (anim !== null) return;
        gesture.current = { x: e.clientX, y: e.clientY, dragging: false };
      }}
      onPointerMove={(e) => {
        const g = gesture.current;
        if (!g || anim !== null) return;
        const dx = e.clientX - g.x;
        const dy = e.clientY - g.y;
        if (!g.dragging) {
          if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
            g.dragging = true;
            suppressClick.current = true;
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          } else {
            return;
          }
        }
        setDrag(dx);
      }}
      onPointerUp={() => {
        const g = gesture.current;
        gesture.current = null;
        setTimeout(() => (suppressClick.current = false), 50);
        if (!g?.dragging) return;
        if (drag < -55) commit(-1);
        else if (drag > 55) commit(1);
        else setDrag(0);
      }}
      onPointerCancel={() => {
        gesture.current = null;
        suppressClick.current = false;
        setDrag(0);
      }}
    >
      <div className="week-panes" style={style}>
        {panes.map((days, pi) => (
          <div className="week-pane" key={pi}>
            {days.map((iso, di) => {
              const isSelected = iso === selected;
              const isToday = iso === today;
              return (
                <button
                  key={iso}
                  className="day-cell"
                  onClick={() => {
                    if (suppressClick.current) return;
                    onSelect(iso);
                  }}
                >
                  <span className="day-label">{WEEKDAYS_SHORT[di]}</span>
                  <span
                    className={
                      'day-num' +
                      (isSelected ? ' selected' : '') +
                      (!isSelected && markers.has(iso) ? ' marked' : '')
                    }
                  >
                    {Number(iso.slice(8, 10))}
                  </span>
                  <span className={'day-dot' + (isToday && !isSelected ? ' visible' : '')} />
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

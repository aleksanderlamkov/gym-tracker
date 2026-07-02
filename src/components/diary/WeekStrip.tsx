import { useLayoutEffect, useRef } from 'react';
import { addDays, todayISO, weekDays, WEEKDAYS_SHORT } from '../../lib/dates';

interface Props {
  viewedMonday: string;
  selected: string;
  markers: Set<string>;
  onSelect: (iso: string) => void;
  onChangeWeek: (monday: string) => void;
}

/**
 * Карусель недель на нативном scroll-snap: свайп обрабатывает браузер,
 * JS только перецентровывает ленту после остановки скролла.
 */
export function WeekStrip({ viewedMonday, selected, markers, onSelect, onChangeWeek }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const touching = useRef(false);
  const settleTimer = useRef(0);
  const suspended = useRef(false);
  const today = todayISO();

  // всегда держим в центре текущую (среднюю) панель
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.clientWidth;
  }, [viewedMonday]);

  useLayoutEffect(() => {
    let t = 0;
    const onResize = () => {
      // при ресайзе/повороте браузер кламует scrollLeft — это не свайп
      suspended.current = true;
      window.clearTimeout(settleTimer.current);
      const el = scroller.current;
      if (el) el.scrollLeft = el.clientWidth;
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        suspended.current = false;
        const el2 = scroller.current;
        if (el2) el2.scrollLeft = el2.clientWidth;
      }, 250);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.clearTimeout(t);
    };
  }, []);

  const settle = () => {
    const el = scroller.current;
    if (!el || touching.current || suspended.current) return;
    const w = el.clientWidth;
    if (!w) return;
    const idx = Math.round(el.scrollLeft / w);
    // ещё не доехали до снап-точки — ждём дальше
    if (Math.abs(el.scrollLeft - idx * w) > w * 0.25) {
      settleTimer.current = window.setTimeout(() => settleRef.current(), 90);
      return;
    }
    if (idx !== 1) onChangeWeek(addDays(viewedMonday, (idx - 1) * 7));
  };
  const settleRef = useRef(settle);
  settleRef.current = settle;

  // нативные слушатели скролла: без реактовской обвязки, passive — не мешаем композитору
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => {
      window.clearTimeout(settleTimer.current);
      settleTimer.current = window.setTimeout(() => settleRef.current(), 90);
    };
    const onScrollEnd = () => {
      window.clearTimeout(settleTimer.current);
      settleRef.current();
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('scrollend', onScrollEnd);
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('scrollend', onScrollEnd);
      window.clearTimeout(settleTimer.current);
    };
  }, []);

  const panes: { monday: string; days: string[] }[] = [-7, 0, 7].map((off) => {
    const monday = addDays(viewedMonday, off);
    return { monday, days: weekDays(monday) };
  });

  return (
    <div className="week-strip">
      <div
        className="week-scroller"
        ref={scroller}
        onPointerDown={() => {
          touching.current = true;
        }}
        onPointerUp={() => {
          touching.current = false;
          window.clearTimeout(settleTimer.current);
          settleTimer.current = window.setTimeout(() => settleRef.current(), 90);
        }}
        onPointerCancel={() => {
          touching.current = false;
          window.clearTimeout(settleTimer.current);
          settleTimer.current = window.setTimeout(() => settleRef.current(), 90);
        }}
      >
        {panes.map((pane) => (
          <div className="week-pane" key={pane.monday}>
            {pane.days.map((iso, di) => {
              const isSelected = iso === selected;
              const isToday = iso === today;
              return (
                <button key={iso} className="day-cell" onClick={() => onSelect(iso)}>
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

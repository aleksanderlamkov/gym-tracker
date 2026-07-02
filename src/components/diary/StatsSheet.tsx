import { useMemo, useState } from 'react';
import type { AppData, Exercise } from '../../types';
import { Sheet } from '../ui/Sheet';
import { Segmented } from '../ui/Segmented';
import { Chart } from './Chart';
import {
  chartsFor,
  exerciseHistory,
  filterByPeriod,
  formatSet,
  PERIODS,
  type Period
} from '../../lib/stats';
import { formatDayGen, formatMonthYear } from '../../lib/dates';

interface Props {
  open: boolean;
  onClose: () => void;
  exercise: Exercise | null;
  data: AppData;
}

export function StatsSheet({ open, onClose, exercise, data }: Props) {
  const [period, setPeriod] = useState<Period>('month');

  const history = useMemo(
    () => (exercise ? exerciseHistory(data, exercise) : []),
    [data, exercise]
  );
  const filtered = useMemo(() => filterByPeriod(history, period), [history, period]);
  const charts = useMemo(
    () => (exercise ? chartsFor(exercise, filtered) : []),
    [exercise, filtered]
  );
  const historyCols = useMemo(() => filtered.slice(-8), [filtered]);

  if (!exercise) return <Sheet open={false} onClose={onClose}>{null}</Sheet>;

  const shortPeriod = period === 'week' || period === 'month';
  const label = (iso: string) => (shortPeriod ? formatDayGen(iso) : formatMonthYear(iso));

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="sheet-title">{exercise.name}</div>
      <Segmented options={PERIODS} value={period} onChange={setPeriod} />

      {charts.length === 0 && (
        <div className="stats-empty">Нет данных за этот период</div>
      )}

      {charts.map((c) => (
        <div key={c.title} className="chart-block">
          <div className="chart-head">
            <span className="chart-title">{c.title}</span>
            <span className="chart-max">{c.maxLabel}</span>
          </div>
          <Chart
            points={c.points}
            leftLabel={label(c.points[0].date)}
            rightLabel={label(c.points[c.points.length - 1].date)}
          />
        </div>
      ))}

      {historyCols.length > 0 && (
        <div className="history-block">
          <div className="history-title">История</div>
          <div className="history-cols">
            {historyCols.map((h) => (
              <div key={h.date} className="history-col">
                <div className="history-date">{formatDayGen(h.date)}</div>
                {h.sets.map((s, i) => (
                  <div key={i} className="history-set">
                    {formatSet(s, exercise)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </Sheet>
  );
}

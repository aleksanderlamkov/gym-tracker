import { useMemo } from 'react';
import { fromISO } from '../../lib/dates';

interface Pt {
  x: number;
  y: number;
}

/** Монотонная кубическая интерполяция (Fritsch–Carlson) — гладкая кривая без перехлёстов */
function monotonePath(pts: Pt[]): string {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M ${pts[0].x} ${pts[0].y}`;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const d = pts[i + 1].x - pts[i].x || 1e-6;
    dx.push(d);
    m.push((pts[i + 1].y - pts[i].y) / d);
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  }
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      t[i] = k * a * m[i];
      t[i + 1] = k * b * m[i];
    }
  }
  let path = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const c1x = pts[i].x + dx[i] / 3;
    const c1y = pts[i].y + (t[i] * dx[i]) / 3;
    const c2x = pts[i + 1].x - dx[i] / 3;
    const c2y = pts[i + 1].y - (t[i + 1] * dx[i]) / 3;
    path += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${pts[i + 1].x.toFixed(2)} ${pts[i + 1].y.toFixed(2)}`;
  }
  return path;
}

interface Props {
  points: { date: string; value: number }[];
  leftLabel: string;
  rightLabel: string;
}

const W = 340;
const H = 130;
const PAD_T = 10;
const PAD_B = 8;

export function Chart({ points, leftLabel, rightLabel }: Props) {
  const { linePath, areaPath, dot } = useMemo(() => {
    if (points.length === 0) return { linePath: '', areaPath: '', dot: null as Pt | null };

    const xs = points.map((p) => fromISO(p.date).getTime());
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const spanX = maxX - minX || 1;

    const vals = points.map((p) => p.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min;
    const lo = span === 0 ? min - Math.max(1, Math.abs(min) * 0.2) : min - span * 0.18;
    const hi = span === 0 ? max + Math.max(1, Math.abs(max) * 0.2) : max + span * 0.12;

    const usableH = H - PAD_T - PAD_B;
    const pts: Pt[] = points.map((p, i) => ({
      x: ((xs[i] - minX) / spanX) * W,
      y: PAD_T + (1 - (p.value - lo) / (hi - lo)) * usableH
    }));

    if (pts.length === 1) {
      return { linePath: '', areaPath: '', dot: { x: W / 2, y: pts[0].y } };
    }
    const line = monotonePath(pts);
    const area = `${line} L ${pts[pts.length - 1].x.toFixed(2)} ${H} L ${pts[0].x.toFixed(2)} ${H} Z`;
    return { linePath: line, areaPath: area, dot: null };
  }, [points]);

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {areaPath && <path d={areaPath} className="chart-area" />}
        {linePath && <path d={linePath} className="chart-line" vectorEffect="non-scaling-stroke" />}
        {dot && <circle cx={dot.x} cy={dot.y} r="4" className="chart-dot" />}
      </svg>
      <div className="chart-axis">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

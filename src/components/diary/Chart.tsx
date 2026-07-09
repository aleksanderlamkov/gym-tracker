import { useMemo, useRef, type PointerEvent } from 'react';
import { fromISO, formatDayFull } from '../../lib/dates';

interface Pt {
  x: number;
  y: number;
}
interface PtF extends Pt {
  value: number;
  date: string;
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
  format: (v: number) => string;
}

const W = 340;
const H = 130;
const PAD_T = 10;
const PAD_B = 8;

export function Chart({ points, leftLabel, rightLabel, format }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const crossRef = useRef<SVGLineElement>(null);
  const focusRef = useRef<SVGCircleElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const downRef = useRef(false);
  const rafRef = useRef(0);
  const pendingXRef = useRef(0);
  const rectRef = useRef<DOMRect | null>(null);

  const { linePath, areaPath, dot, pts } = useMemo(() => {
    if (points.length === 0)
      return { linePath: '', areaPath: '', dot: null as Pt | null, pts: [] as PtF[] };

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
    const pts: PtF[] = points.map((p, i) => ({
      x: points.length === 1 ? W / 2 : ((xs[i] - minX) / spanX) * W,
      y: PAD_T + (1 - (p.value - lo) / (hi - lo)) * usableH,
      value: p.value,
      date: p.date
    }));

    if (pts.length === 1) {
      return { linePath: '', areaPath: '', dot: { x: pts[0].x, y: pts[0].y }, pts };
    }
    const line = monotonePath(pts);
    const area = `${line} L ${pts[pts.length - 1].x.toFixed(2)} ${H} L ${pts[0].x.toFixed(2)} ${H} Z`;
    return { linePath: line, areaPath: area, dot: null, pts };
  }, [points]);

  // держим точки и форматтер в ref, чтобы скраб-обработчики не пересоздавались
  const ptsRef = useRef<PtF[]>(pts);
  ptsRef.current = pts;
  const fmtRef = useRef(format);
  fmtRef.current = format;

  /** позиционирует перекрестье, точку и подпись по ближайшей к пальцу дате (императивно, без ре-рендера) */
  function apply(clientX: number) {
    const pts = ptsRef.current;
    const rect = rectRef.current;
    if (!rect || pts.length === 0) return;
    const svgX = ((clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const d = Math.abs(pts[i].x - svgX);
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    const p = pts[best];
    crossRef.current?.setAttribute('x1', p.x.toFixed(2));
    crossRef.current?.setAttribute('x2', p.x.toFixed(2));
    focusRef.current?.setAttribute('cx', p.x.toFixed(2));
    focusRef.current?.setAttribute('cy', p.y.toFixed(2));

    const tip = tipRef.current;
    if (!tip) return;
    tip.innerHTML = `<span class="v">${fmtRef.current(p.value)}</span> · ${formatDayFull(p.date)}`;
    // горизонталь: центрируем над точкой и держим в границах графика
    tip.style.left = '0px';
    const tw = tip.offsetWidth;
    const centerPx = (p.x / W) * rect.width;
    tip.style.left = `${Math.max(0, Math.min(centerPx - tw / 2, rect.width - tw))}px`;
    // вертикаль: подпись в половину, противоположную точке, чтобы не перекрывать её
    const dotPx = (p.y / H) * rect.height;
    tip.style.top = dotPx < rect.height * 0.5 ? `${rect.height - 30}px` : '2px';
  }

  function scheduleApply(clientX: number) {
    pendingXRef.current = clientX;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      apply(pendingXRef.current);
    });
  }

  function onDown(e: PointerEvent<SVGSVGElement>) {
    if (ptsRef.current.length === 0) return;
    downRef.current = true;
    rectRef.current = svgRef.current!.getBoundingClientRect();
    chartRef.current?.classList.add('scrubbing');
    try {
      svgRef.current?.setPointerCapture(e.pointerId);
    } catch {
      /* указатель мог уже освободиться — не критично */
    }
    apply(e.clientX);
  }
  function onMove(e: PointerEvent<SVGSVGElement>) {
    if (!downRef.current) return;
    scheduleApply(e.clientX);
  }
  function onUp() {
    if (!downRef.current) return;
    downRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    chartRef.current?.classList.remove('scrubbing');
  }

  return (
    <div className="chart" ref={chartRef}>
      <div className="chart-tip" ref={tipRef} />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {areaPath && <path d={areaPath} className="chart-area" />}
        {linePath && <path d={linePath} className="chart-line" vectorEffect="non-scaling-stroke" />}
        {dot && <circle cx={dot.x} cy={dot.y} r="4" className="chart-dot" />}
        <line
          ref={crossRef}
          className="chart-cross"
          x1="0"
          y1="0"
          x2="0"
          y2={H}
          vectorEffect="non-scaling-stroke"
        />
        <circle ref={focusRef} className="chart-focus" cx="0" cy="0" r="4.5" />
      </svg>
      <div className="chart-axis">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

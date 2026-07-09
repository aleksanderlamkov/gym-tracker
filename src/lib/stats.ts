import type { AppData, Exercise, SetRecord } from '../types';
import { addDays, todayISO } from './dates';

export type Period = 'week' | 'month' | 'year' | 'all';

export const PERIODS: { id: Period; name: string }[] = [
  { id: 'week', name: 'Неделя' },
  { id: 'month', name: 'Месяц' },
  { id: 'year', name: 'Год' },
  { id: 'all', name: 'Все' }
];

export interface DayStat {
  date: string;
  sets: SetRecord[];
  maxWeight: number;
  tonnage: number;
  maxReps: number;
  totalReps: number;
  totalTimeMin: number;
  maxTimeMin: number;
  totalDistanceKm: number;
}

/** Все дни, где есть непустые подходы по упражнению (по возрастанию даты) */
export function exerciseHistory(data: AppData, exercise: Exercise): DayStat[] {
  const byDate = new Map<string, SetRecord[]>();
  for (const w of data.workouts) {
    for (const e of w.entries) {
      if (e.exerciseId !== exercise.id || e.sets.length === 0) continue;
      const arr = byDate.get(w.date) ?? [];
      arr.push(...e.sets);
      byDate.set(w.date, arr);
    }
  }
  const mult = exercise.doubled ? 2 : 1;
  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, sets]) => {
      let maxWeight = 0;
      let tonnage = 0;
      let maxReps = 0;
      let totalReps = 0;
      let totalTimeMin = 0;
      let maxTimeMin = 0;
      let totalDistanceKm = 0;
      for (const s of sets) {
        if (s.weight !== undefined) maxWeight = Math.max(maxWeight, s.weight);
        tonnage += (s.weight ?? 0) * (s.reps ?? 0) * mult;
        if (s.reps !== undefined) {
          maxReps = Math.max(maxReps, s.reps);
          totalReps += s.reps;
        }
        if (s.timeMin !== undefined) {
          totalTimeMin += s.timeMin;
          maxTimeMin = Math.max(maxTimeMin, s.timeMin);
        }
        if (s.distanceKm !== undefined) totalDistanceKm += s.distanceKm;
      }
      return { date, sets, maxWeight, tonnage, maxReps, totalReps, totalTimeMin, maxTimeMin, totalDistanceKm };
    });
}

export function filterByPeriod(history: DayStat[], period: Period): DayStat[] {
  if (period === 'all') return history;
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
  const cutoff = addDays(todayISO(), -days);
  return history.filter((h) => h.date >= cutoff);
}

export interface ChartSpec {
  title: string;
  /** max за период, показывается рядом с заголовком */
  maxLabel: string;
  /** форматирование значения точки с единицей — для скраба по графику */
  format: (v: number) => string;
  points: { date: string; value: number }[];
}

const fmt = (n: number): string =>
  (Math.round(n * 100) / 100).toLocaleString('ru-RU');

/** Набор графиков под тип упражнения */
export function chartsFor(exercise: Exercise, history: DayStat[]): ChartSpec[] {
  if (history.length === 0) return [];
  const mk = (title: string, sel: (d: DayStat) => number, unit = ''): ChartSpec => {
    const points = history.map((h) => ({ date: h.date, value: sel(h) }));
    const max = Math.max(...points.map((p) => p.value));
    const format = (v: number) => `${fmt(v)}${unit}`;
    return { title, maxLabel: `max ${format(max)}`, format, points };
  };

  if (exercise.metric === 'time') {
    // без единиц: кто-то пишет минуты, кто-то секунды
    return [mk('Время', (d) => d.maxTimeMin), mk('Сумма времени', (d) => d.totalTimeMin)];
  }
  if (exercise.metric === 'time-distance') {
    return [mk('Дистанция', (d) => d.totalDistanceKm, ' км'), mk('Время', (d) => d.totalTimeMin, ' мин')];
  }
  // вес × повторы; если весов нет вообще (свой вес) — графики по повторам
  const anyWeight = history.some((h) => h.maxWeight > 0);
  if (!anyWeight) {
    return [mk('Повторы', (d) => d.maxReps), mk('Объём', (d) => d.totalReps)];
  }
  return [mk('Вес', (d) => d.maxWeight), mk('Тоннаж', (d) => d.tonnage)];
}

/** Строки для колонки истории: '25 × 10', '8 мин', '5,2 км' */
export function formatSet(s: SetRecord, exercise: Exercise): string {
  const parts: string[] = [];
  if (exercise.metric === 'time-distance') {
    if (s.distanceKm !== undefined) parts.push(`${fmt(s.distanceKm)} км`);
    if (s.timeMin !== undefined) parts.push(`${fmt(s.timeMin)} мин`);
    return parts.join(' · ') || '—';
  }
  if (exercise.metric === 'time') {
    if (s.timeMin !== undefined) return fmt(s.timeMin);
  }
  if (s.weight !== undefined || s.reps !== undefined) {
    return `${fmt(s.weight ?? 0)} × ${s.reps ?? 0}`;
  }
  if (s.timeMin !== undefined) return fmt(s.timeMin);
  return '—';
}

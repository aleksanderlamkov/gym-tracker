export const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

export const MONTHS_SHORT = [
  'Янв.', 'Февр.', 'Март', 'Апр.', 'Май', 'Июнь',
  'Июль', 'Авг.', 'Сент.', 'Окт.', 'Нояб.', 'Дек.'
];

export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

/** Date -> 'YYYY-MM-DD' в локальном времени */
export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 'YYYY-MM-DD' -> Date (локальная полночь) */
export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return toISO(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = fromISO(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

/** ISO понедельника недели, в которую входит дата */
export function mondayOf(iso: string): string {
  const d = fromISO(iso);
  const dow = (d.getDay() + 6) % 7; // 0 = понедельник
  d.setDate(d.getDate() - dow);
  return toISO(d);
}

export function weekDays(mondayISO: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(mondayISO, i));
}

/** '4 июня' */
export function formatDayGen(iso: string): string {
  const d = fromISO(iso);
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`;
}

/** '4 июня 2025' — с годом, если не текущий */
export function formatDayFull(iso: string): string {
  const d = fromISO(iso);
  const now = new Date();
  const year = d.getFullYear() === now.getFullYear() ? '' : ` ${d.getFullYear()}`;
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}${year}`;
}

/** 'Июнь 2026' для осей графика */
export function formatMonthYear(iso: string): string {
  const d = fromISO(iso);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function daysBetween(aISO: string, bISO: string): number {
  return Math.round((fromISO(bISO).getTime() - fromISO(aISO).getTime()) / 86400000);
}

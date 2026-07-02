export type CategoryId =
  | 'back'
  | 'chest'
  | 'legs'
  | 'arms'
  | 'shoulders'
  | 'abs'
  | 'cardio'
  | 'stretching'
  | 'other';

/** Какие колонки показывать в редакторе подходов */
export type Metric = 'weight-reps' | 'time' | 'time-distance';

export interface Exercise {
  id: string;
  name: string;
  category: CategoryId;
  /** Вес на каждую руку (гантели) — отображается как «×2», тоннаж считается вдвое */
  doubled: boolean;
  /** Упражнение с собственным весом (вес в подходе = добавочный) */
  bodyweight: boolean;
  metric: Metric;
  /** Скрыто из выбора, история сохраняется */
  archived?: boolean;
}

export interface SetRecord {
  weight?: number;
  reps?: number;
  timeMin?: number;
  distanceKm?: number;
}

export interface WorkoutEntry {
  id: string;
  exerciseId: string;
  sets: SetRecord[];
  /** Записи с одинаковым supersetId образуют суперсет */
  supersetId?: string;
}

export interface Workout {
  id: string;
  /** YYYY-MM-DD, локальная дата */
  date: string;
  name: string;
  programId?: string;
  entries: WorkoutEntry[];
}

export interface ProgramEntry {
  id: string;
  exerciseId: string;
  supersetId?: string;
}

export interface Program {
  id: string;
  name: string;
  description?: string;
  entries: ProgramEntry[];
}

export interface AppData {
  version: 1;
  exercises: Exercise[];
  programs: Program[];
  workouts: Workout[];
}

export const CATEGORIES: { id: CategoryId; name: string }[] = [
  { id: 'back', name: 'Спина' },
  { id: 'chest', name: 'Грудь' },
  { id: 'legs', name: 'Ноги' },
  { id: 'arms', name: 'Руки' },
  { id: 'shoulders', name: 'Плечи' },
  { id: 'abs', name: 'Пресс' },
  { id: 'cardio', name: 'Кардио' },
  { id: 'stretching', name: 'Растяжка' },
  { id: 'other', name: 'Другое' }
];

export const categoryName = (id: CategoryId): string =>
  CATEGORIES.find((c) => c.id === id)?.name ?? 'Другое';

export function emptyData(): AppData {
  return { version: 1, exercises: [], programs: [], workouts: [] };
}

import { useSyncExternalStore } from 'react';
import type { AppData, Exercise, Program, SetRecord, Workout, WorkoutEntry } from './types';
import { emptyData } from './types';
import { id } from './lib/id';

const STORAGE_KEY = 'gym-tracker:data:v1';

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as AppData;
    if (parsed && parsed.version === 1) return parsed;
    return emptyData();
  } catch (e) {
    console.error('Не удалось загрузить данные', e);
    return emptyData();
  }
}

let data: AppData = load();
const listeners = new Set<() => void>();

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let dirty = false;

function persistNow() {
  if (!dirty) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    dirty = false;
  } catch (e) {
    console.error('Не удалось сохранить данные', e);
  }
}

function schedulePersist() {
  dirty = true;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(persistNow, 400);
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', persistNow);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') persistNow();
  });
}

function set(next: AppData) {
  data = next;
  schedulePersist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, () => data);
}

export function getData(): AppData {
  return data;
}

// ---------- helpers ----------

function patchWorkout(workoutId: string, fn: (w: Workout) => Workout) {
  set({
    ...data,
    workouts: data.workouts.map((w) => (w.id === workoutId ? fn(w) : w))
  });
}

function patchEntry(workoutId: string, entryId: string, fn: (e: WorkoutEntry) => WorkoutEntry) {
  patchWorkout(workoutId, (w) => ({
    ...w,
    entries: w.entries.map((e) => (e.id === entryId ? fn(e) : e))
  }));
}

/** Последние непустые подходы по упражнению до указанной тренировки */
export function lastSetsFor(
  d: AppData,
  exerciseId: string,
  beforeDate: string,
  excludeWorkoutId: string
): { sets: SetRecord[]; date: string } | null {
  const candidates = d.workouts
    .filter((w) => w.id !== excludeWorkoutId && w.date <= beforeDate)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  for (const w of candidates) {
    for (const e of w.entries) {
      if (e.exerciseId === exerciseId && e.sets.length > 0) {
        return { sets: e.sets.map((s) => ({ ...s })), date: w.date };
      }
    }
  }
  return null;
}

// ---------- actions ----------

export const actions = {
  // --- workouts ---
  addWorkoutFromProgram(date: string, programId: string): string {
    const program = data.programs.find((p) => p.id === programId);
    if (!program) return '';
    const w: Workout = {
      id: id(),
      date,
      name: program.name,
      programId,
      entries: program.entries.map((pe) => ({
        id: id(),
        exerciseId: pe.exerciseId,
        supersetId: pe.supersetId,
        sets: []
      }))
    };
    set({ ...data, workouts: [...data.workouts, w] });
    return w.id;
  },

  addEmptyWorkout(date: string): string {
    const w: Workout = { id: id(), date, name: '', entries: [] };
    set({ ...data, workouts: [...data.workouts, w] });
    return w.id;
  },

  deleteWorkout(workoutId: string) {
    set({ ...data, workouts: data.workouts.filter((w) => w.id !== workoutId) });
  },

  renameWorkout(workoutId: string, name: string) {
    patchWorkout(workoutId, (w) => ({ ...w, name }));
  },

  moveWorkout(workoutId: string, date: string) {
    patchWorkout(workoutId, (w) => ({ ...w, date }));
  },

  // --- entries ---
  addEntry(workoutId: string, exerciseId: string) {
    patchWorkout(workoutId, (w) => ({
      ...w,
      entries: [...w.entries, { id: id(), exerciseId, sets: [] }]
    }));
  },

  removeEntry(workoutId: string, entryId: string) {
    patchWorkout(workoutId, (w) => ({
      ...w,
      entries: w.entries.filter((e) => e.id !== entryId)
    }));
  },

  moveEntry(workoutId: string, entryId: string, dir: -1 | 1) {
    patchWorkout(workoutId, (w) => {
      const idx = w.entries.findIndex((e) => e.id === entryId);
      const to = idx + dir;
      if (idx < 0 || to < 0 || to >= w.entries.length) return w;
      const entries = [...w.entries];
      const [item] = entries.splice(idx, 1);
      entries.splice(to, 0, item);
      return { ...w, entries };
    });
  },

  /** Связать/разорвать суперсет со следующим упражнением */
  toggleSupersetWithNext(workoutId: string, entryId: string) {
    patchWorkout(workoutId, (w) => {
      const idx = w.entries.findIndex((e) => e.id === entryId);
      if (idx < 0 || idx >= w.entries.length - 1) return w;
      const cur = w.entries[idx];
      const next = w.entries[idx + 1];
      const entries = [...w.entries];
      if (cur.supersetId && cur.supersetId === next.supersetId) {
        entries[idx + 1] = { ...next, supersetId: undefined };
      } else {
        const sid = cur.supersetId ?? id();
        entries[idx] = { ...cur, supersetId: sid };
        entries[idx + 1] = { ...next, supersetId: sid };
      }
      return { ...w, entries };
    });
  },

  // --- sets ---
  updateSet(workoutId: string, entryId: string, setIndex: number, patch: Partial<SetRecord>) {
    patchEntry(workoutId, entryId, (e) => ({
      ...e,
      sets: e.sets.map((s, i) => (i === setIndex ? { ...s, ...patch } : s))
    }));
  },

  /** Добавить подход — копия последнего */
  addSet(workoutId: string, entryId: string) {
    patchEntry(workoutId, entryId, (e) => {
      const last = e.sets[e.sets.length - 1];
      return { ...e, sets: [...e.sets, last ? { ...last } : {}] };
    });
  },

  removeSet(workoutId: string, entryId: string, setIndex: number) {
    patchEntry(workoutId, entryId, (e) => ({
      ...e,
      sets: e.sets.filter((_, i) => i !== setIndex)
    }));
  },

  /** «Как в прошлый раз» — скопировать последние показатели */
  fillFromLast(workoutId: string, entryId: string) {
    const w = data.workouts.find((x) => x.id === workoutId);
    const e = w?.entries.find((x) => x.id === entryId);
    if (!w || !e) return;
    const last = lastSetsFor(data, e.exerciseId, w.date, w.id);
    if (!last) return;
    patchEntry(workoutId, entryId, (en) => ({ ...en, sets: last.sets }));
  },

  // --- programs ---
  saveProgram(program: Program) {
    const exists = data.programs.some((p) => p.id === program.id);
    set({
      ...data,
      programs: exists
        ? data.programs.map((p) => (p.id === program.id ? program : p))
        : [...data.programs, program]
    });
  },

  deleteProgram(programId: string) {
    set({ ...data, programs: data.programs.filter((p) => p.id !== programId) });
  },

  // --- exercises ---
  saveExercise(exercise: Exercise) {
    const exists = data.exercises.some((e) => e.id === exercise.id);
    set({
      ...data,
      exercises: exists
        ? data.exercises.map((e) => (e.id === exercise.id ? exercise : e))
        : [...data.exercises, exercise]
    });
  },

  /** true — удалено, false — заархивировано (есть история) */
  deleteOrArchiveExercise(exerciseId: string): boolean {
    const used =
      data.workouts.some((w) => w.entries.some((e) => e.exerciseId === exerciseId)) ||
      data.programs.some((p) => p.entries.some((e) => e.exerciseId === exerciseId));
    if (used) {
      set({
        ...data,
        exercises: data.exercises.map((e) =>
          e.id === exerciseId ? { ...e, archived: true } : e
        )
      });
      return false;
    }
    set({ ...data, exercises: data.exercises.filter((e) => e.id !== exerciseId) });
    return true;
  },

  restoreExercise(exerciseId: string) {
    set({
      ...data,
      exercises: data.exercises.map((e) =>
        e.id === exerciseId ? { ...e, archived: false } : e
      )
    });
  },

  // --- data ---
  replaceAll(next: AppData) {
    set(next);
    persistNow();
  },

  clearAll() {
    set(emptyData());
    persistNow();
  }
};

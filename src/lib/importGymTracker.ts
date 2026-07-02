import type { AppData, CategoryId, Exercise, Metric, Program, SetRecord, Workout } from '../types';
import { id } from './id';
import { toISO } from './dates';

/** Формат бэкапа оригинального iOS-приложения Gym Tracker (.gymtracker) */
interface GTBackup {
  backupDate?: string;
  exercises: GTExercise[];
  programs: GTProgram[];
  trainings: GTTraining[];
  calendarDays: GTCalendarDay[];
  exerciseSets: GTExerciseSet[];
  exerciseSetApproaches: GTApproach[];
  exerciseSupersets?: { id: string; exerciseSetsIds: string[] }[];
}

interface GTExercise {
  id: string;
  name: string;
  categoryId?: string;
  isWeightDoubled?: boolean;
  isUsingSelfWeight?: boolean;
  isUsingGrips?: boolean;
}

interface GTProgram {
  id: string;
  name: string;
  programDescription?: string;
  exerciseSetIds: string[];
}

interface GTTraining {
  id: string;
  name: string;
  exerciseSetIds: string[];
}

interface GTCalendarDay {
  id: string;
  date: string;
  trainingId?: string;
}

interface GTExerciseSet {
  id: string;
  exerciseId: string;
  approachIds: string[];
  supersetId?: string;
}

interface GTApproach {
  id: string;
  weight?: number;
  repeats?: number;
  timeInMinutes?: number;
  distance?: number;
}

const CATEGORY_MAP: Record<string, CategoryId> = {
  backCategory: 'back',
  chestCategory: 'chest',
  legsCategory: 'legs',
  armsCategory: 'arms',
  shouldersCategory: 'shoulders',
  abdominalsCategory: 'abs',
  cardioCategory: 'cardio',
  stretchingCategory: 'stretching'
};

export function isGymTrackerBackup(json: unknown): json is GTBackup {
  const j = json as Record<string, unknown>;
  return (
    !!j &&
    Array.isArray(j.exercises) &&
    Array.isArray(j.trainings) &&
    Array.isArray(j.exerciseSetApproaches) &&
    Array.isArray(j.calendarDays)
  );
}

export interface ImportResult {
  data: AppData;
  stats: {
    exercises: number;
    programs: number;
    workouts: number;
    sets: number;
    skippedTrainings: number;
    firstDate: string | null;
    lastDate: string | null;
  };
}

function convertApproach(a: GTApproach): SetRecord | null {
  const s: SetRecord = {};
  if (typeof a.weight === 'number') s.weight = a.weight;
  if (typeof a.repeats === 'number') s.reps = a.repeats;
  if (typeof a.timeInMinutes === 'number') s.timeMin = a.timeInMinutes;
  if (typeof a.distance === 'number') s.distanceKm = a.distance;
  return Object.keys(s).length > 0 ? s : null;
}

export function importGymTracker(backup: GTBackup): ImportResult {
  const approachById = new Map(backup.exerciseSetApproaches.map((a) => [a.id, a]));
  const setById = new Map(backup.exerciseSets.map((s) => [s.id, s]));
  const trainingById = new Map(backup.trainings.map((t) => [t.id, t]));

  // --- упражнения ---
  const exercises: Exercise[] = backup.exercises.map((e) => ({
    id: e.id,
    name: e.name.trim(),
    category: CATEGORY_MAP[e.categoryId ?? ''] ?? 'other',
    doubled: !!e.isWeightDoubled,
    bodyweight: !!e.isUsingSelfWeight,
    metric: 'weight-reps' as Metric
  }));
  const exerciseIds = new Set(exercises.map((e) => e.id));

  // --- тренировки: calendarDay.trainingId -> training ---
  const workouts: Workout[] = [];
  let totalSets = 0;
  let skippedTrainings = 0;
  const usedTrainingIds = new Set<string>();

  const sortedDays = [...backup.calendarDays]
    .filter((d) => d.trainingId)
    .sort((a, b) => a.date.localeCompare(b.date));

  for (const day of sortedDays) {
    const training = trainingById.get(day.trainingId!);
    if (!training) {
      skippedTrainings++;
      continue;
    }
    usedTrainingIds.add(training.id);
    const date = toISO(new Date(day.date)); // локальный день пользователя

    const entries = training.exerciseSetIds
      .map((sid) => setById.get(sid))
      .filter((s): s is GTExerciseSet => !!s && exerciseIds.has(s.exerciseId))
      .map((s) => {
        const sets = s.approachIds
          .map((aid) => approachById.get(aid))
          .filter((a): a is GTApproach => !!a)
          .map(convertApproach)
          .filter((x): x is SetRecord => x !== null);
        totalSets += sets.length;
        return {
          id: id(),
          exerciseId: s.exerciseId,
          supersetId: s.supersetId,
          sets
        };
      });

    workouts.push({ id: id(), date, name: training.name.trim(), entries });
  }

  skippedTrainings += backup.trainings.filter((t) => !usedTrainingIds.has(t.id)).length;

  // --- программы ---
  const programs: Program[] = backup.programs.map((p) => ({
    id: p.id,
    name: p.name.trim(),
    description: p.programDescription?.trim() || undefined,
    entries: p.exerciseSetIds
      .map((sid) => setById.get(sid))
      .filter((s): s is GTExerciseSet => !!s && exerciseIds.has(s.exerciseId))
      .map((s) => ({ id: id(), exerciseId: s.exerciseId, supersetId: s.supersetId }))
  }));

  // --- метрика упражнения: по использованию полей во всей истории ---
  const fieldUse = new Map<string, { wr: number; t: number; dist: number }>();
  for (const w of workouts) {
    for (const e of w.entries) {
      const u = fieldUse.get(e.exerciseId) ?? { wr: 0, t: 0, dist: 0 };
      for (const s of e.sets) {
        if (s.distanceKm !== undefined) u.dist++;
        if (s.weight !== undefined || s.reps !== undefined) u.wr++;
        else if (s.timeMin !== undefined) u.t++;
      }
      fieldUse.set(e.exerciseId, u);
    }
  }
  for (const e of exercises) {
    const u = fieldUse.get(e.id);
    let m: Metric = 'weight-reps';
    if (u?.dist) m = 'time-distance';
    else if (u && u.t > u.wr) m = 'time';
    else if ((!u || u.wr === 0) && e.category === 'cardio') m = 'time-distance';
    e.metric = m;
  }

  const dates = workouts.map((w) => w.date).sort();
  return {
    data: { version: 1, exercises, programs, workouts },
    stats: {
      exercises: exercises.length,
      programs: programs.length,
      workouts: workouts.length,
      sets: totalSets,
      skippedTrainings,
      firstDate: dates[0] ?? null,
      lastDate: dates[dates.length - 1] ?? null
    }
  };
}

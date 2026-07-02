import type { AppData } from '../types';
import { emptyData } from '../types';
import { todayISO } from './dates';
import { importGymTracker, isGymTrackerBackup, type ImportResult } from './importGymTracker';

interface NativeBackup {
  app: 'gym-tracker';
  exportedAt: string;
  data: AppData;
}

export function exportBackup(data: AppData) {
  const payload: NativeBackup = {
    app: 'gym-tracker',
    exportedAt: new Date().toISOString(),
    data
  };
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gym-tracker-backup-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function sanitize(data: AppData): AppData {
  // минимальная валидация структуры, чтобы кривой файл не сломал приложение
  const base = emptyData();
  return {
    version: 1,
    exercises: Array.isArray(data.exercises) ? data.exercises : base.exercises,
    programs: Array.isArray(data.programs) ? data.programs : base.programs,
    workouts: Array.isArray(data.workouts) ? data.workouts : base.workouts
  };
}

export type ParsedImport =
  | { kind: 'native'; data: AppData; workouts: number }
  | { kind: 'gymtracker'; result: ImportResult }
  | { kind: 'error'; message: string };

export function parseImportFile(text: string): ParsedImport {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { kind: 'error', message: 'Файл не похож на бэкап (не JSON).' };
  }
  const j = json as Record<string, unknown>;
  if (j && j.app === 'gym-tracker' && j.data) {
    const data = sanitize(j.data as AppData);
    return { kind: 'native', data, workouts: data.workouts.length };
  }
  if (isGymTrackerBackup(json)) {
    try {
      return { kind: 'gymtracker', result: importGymTracker(json) };
    } catch (e) {
      return { kind: 'error', message: 'Не удалось разобрать бэкап Gym Tracker: ' + String(e) };
    }
  }
  return { kind: 'error', message: 'Неизвестный формат файла.' };
}

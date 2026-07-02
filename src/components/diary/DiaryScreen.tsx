import { useMemo, useState } from 'react';
import type { AppData } from '../../types';
import { WeekStrip } from './WeekStrip';
import { WorkoutCard } from './WorkoutCard';
import { AddWorkoutSheet } from './AddWorkoutSheet';
import { SetsEditorSheet } from './SetsEditorSheet';
import { Icon } from '../ui/Icons';
import {
  addDays,
  daysBetween,
  formatDayFull,
  fromISO,
  MONTHS,
  mondayOf,
  todayISO
} from '../../lib/dates';
import { daysPlural } from '../../lib/plural';

interface Props {
  data: AppData;
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  onGoPrograms: () => void;
  onGoSettings: () => void;
}

export function DiaryScreen({ data, selectedDate, onSelectDate, onGoPrograms, onGoSettings }: Props) {
  const today = todayISO();
  const [viewedMonday, setViewedMonday] = useState(() => mondayOf(selectedDate));
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<{ workoutId: string; entryId: string } | null>(null);

  const markers = useMemo(() => new Set(data.workouts.map((w) => w.date)), [data.workouts]);

  const dayWorkouts = useMemo(
    () => data.workouts.filter((w) => w.date === selectedDate),
    [data.workouts, selectedDate]
  );

  const lastWorkoutDate = useMemo(() => {
    let last: string | null = null;
    for (const w of data.workouts) {
      if (w.date <= today && (!last || w.date > last)) last = w.date;
    }
    return last;
  }, [data.workouts, today]);

  const onCurrentWeek = viewedMonday === mondayOf(today);
  const title =
    onCurrentWeek && selectedDate === today
      ? 'Сегодня'
      : MONTHS[fromISO(addDays(viewedMonday, 3)).getMonth()];

  const goToday = () => {
    onSelectDate(today);
    setViewedMonday(mondayOf(today));
  };

  const selectDate = (iso: string) => {
    onSelectDate(iso);
    setViewedMonday(mondayOf(iso));
  };

  const hasAnything = data.workouts.length > 0 || data.programs.length > 0;
  // полных дней отдыха, не считая сегодняшний — как в оригинальном Gym Tracker
  const restDays =
    lastWorkoutDate && dayWorkouts.length === 0
      ? daysBetween(lastWorkoutDate, today) - 1
      : -1;

  return (
    <div className="screen diary">
      <header className="screen-head">
        <h1>{title}</h1>
        <div className="head-actions">
          {!(onCurrentWeek && selectedDate === today) && (
            <button className="chip-btn" onClick={goToday}>
              Сегодня
            </button>
          )}
          <button
            className="icon-btn desktop-only"
            aria-label="Предыдущая неделя"
            onClick={() => setViewedMonday(addDays(viewedMonday, -7))}
          >
            <Icon name="chevron-left" />
          </button>
          <button
            className="icon-btn desktop-only"
            aria-label="Следующая неделя"
            onClick={() => setViewedMonday(addDays(viewedMonday, 7))}
          >
            <Icon name="chevron-right" />
          </button>
        </div>
      </header>

      <WeekStrip
        viewedMonday={viewedMonday}
        selected={selectedDate}
        markers={markers}
        onSelect={selectDate}
        onChangeWeek={setViewedMonday}
      />

      <div className="day-content">
        {dayWorkouts.length > 0 ? (
          dayWorkouts.map((w) => (
            <WorkoutCard
              key={w.id}
              workout={w}
              data={data}
              onOpenEntry={(workoutId, entryId) => setEditing({ workoutId, entryId })}
            />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="barbell" size={90} strokeWidth={1.4} />
            </div>
            {!hasAnything ? (
              <>
                <p className="empty-title">Начнём!</p>
                <p className="empty-text">
                  Импортируй бэкап из старого приложения или создай свою первую программу
                  тренировок.
                </p>
                <div className="empty-actions">
                  <button className="btn-secondary" onClick={onGoSettings}>
                    Импорт бэкапа
                  </button>
                  <button className="btn-secondary" onClick={onGoPrograms}>
                    Создать программу
                  </button>
                </div>
              </>
            ) : (
              <p className="empty-text">
                {selectedDate === today
                  ? restDays >= 1
                    ? `Тренировок не было уже ${daysPlural(restDays)}`
                    : 'Вчера была тренировка. Сегодня отдых?'
                  : `${formatDayFull(selectedDate)} — тренировки нет`}
              </p>
            )}
          </div>
        )}
      </div>

      <button className="fab" aria-label="Добавить тренировку" onClick={() => setAddOpen(true)}>
        <Icon name="plus" size={28} />
      </button>

      <AddWorkoutSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        date={selectedDate}
        data={data}
        onGoPrograms={onGoPrograms}
      />
      <SetsEditorSheet
        open={!!editing}
        onClose={() => setEditing(null)}
        workoutId={editing?.workoutId ?? null}
        entryId={editing?.entryId ?? null}
        data={data}
      />
    </div>
  );
}

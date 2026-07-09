import { useEffect, useRef, useState } from 'react';
import type { AppData } from '../../types';
import { actions } from '../../store';
import { exportBackup, parseImportFile, type ParsedImport } from '../../lib/backup';
import { Sheet } from '../ui/Sheet';
import { ActionSheet } from '../ui/ActionSheet';
import { Icon } from '../ui/Icons';
import { showToast } from '../ui/toast';
import { exercisesPlural, workoutsPlural } from '../../lib/plural';
import { formatDayFull } from '../../lib/dates';

interface Props {
  data: AppData;
}

export function SettingsScreen({ data }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ParsedImport | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
  }, []);

  const sizeKB = Math.max(1, Math.round(JSON.stringify(data).length / 1024));

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    const parsed = parseImportFile(text);
    if (parsed.kind === 'error') {
      showToast(parsed.message);
    } else {
      setPending(parsed);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const doImport = () => {
    if (!pending || pending.kind === 'error') return;
    const next = pending.kind === 'native' ? pending.data : pending.result.data;
    actions.replaceAll(next);
    setPending(null);
    showToast('Импорт завершён');
  };

  const requestPersist = async () => {
    try {
      const ok = await navigator.storage.persist();
      setPersisted(ok);
      showToast(ok ? 'Хранилище защищено' : 'Браузер не разрешил');
    } catch {
      showToast('Не поддерживается браузером');
    }
  };

  return (
    <div className="screen">
      <header className="screen-head">
        <h1>Ещё</h1>
      </header>

      <div className="list-section">
        <div className="list-section-title">Данные</div>
        <div className="list-card">
          <button className="settings-row" onClick={() => exportBackup(data)}>
            <Icon name="download" size={20} />
            <span className="settings-row-text">
              Экспорт бэкапа
              <span className="list-row-sub">JSON-файл со всеми данными</span>
            </span>
          </button>
          <button className="settings-row" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={20} />
            <span className="settings-row-text">
              Импорт бэкапа
              <span className="list-row-sub">свой .json или .gymtracker из старого приложения</span>
            </span>
          </button>
        </div>
      </div>

      <div className="list-section">
        <div className="list-section-title">Хранилище</div>
        <div className="list-card">
          <div className="settings-row static">
            <span className="settings-row-text">
              Данные на этом устройстве
              <span className="list-row-sub">
                {workoutsPlural(data.workouts.length)} · {exercisesPlural(data.exercises.length)} ·{' '}
                {sizeKB} КБ
              </span>
            </span>
          </div>
          <button className="settings-row" onClick={requestPersist}>
            <span className="settings-row-text">
              Постоянное хранилище
              <span className="list-row-sub">
                {persisted === true
                  ? 'включено — браузер не удалит данные'
                  : persisted === false
                    ? 'не включено — нажми, чтобы запросить'
                    : 'статус неизвестен'}
              </span>
            </span>
            {persisted === true && <Icon name="check" size={18} />}
          </button>
        </div>
      </div>

      <div className="list-section">
        <div className="list-section-title">Приложение</div>
        <div className="list-card">
          <div className="settings-row static">
            <span className="settings-row-text">
              Установка на iPhone
              <span className="list-row-sub">
                Открой сайт в Safari → «Поделиться» → «На экран “Домой”». Приложение будет работать
                офлайн.
              </span>
            </span>
          </div>
          <div className="settings-row static">
            <span className="settings-row-text">
              Gym Tracker
              <span className="list-row-sub">
                версия {__APP_VERSION__} · данные хранятся только на устройстве
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="list-section">
        <div className="list-card">
          <button className="settings-row danger" onClick={() => setConfirmClear(true)}>
            <Icon name="trash" size={20} />
            <span className="settings-row-text">Очистить все данные</span>
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".json,.gymtracker,application/json"
        hidden
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      <Sheet open={!!pending && pending.kind !== 'error'} onClose={() => setPending(null)}>
        {pending && pending.kind === 'gymtracker' && (
          <>
            <div className="sheet-title">Бэкап Gym Tracker (iOS)</div>
            <div className="import-summary">
              <div className="import-line">
                <b>{workoutsPlural(pending.result.stats.workouts)}</b>
                {pending.result.stats.firstDate && pending.result.stats.lastDate && (
                  <span>
                    {' '}
                    · с {formatDayFull(pending.result.stats.firstDate)} по{' '}
                    {formatDayFull(pending.result.stats.lastDate)}
                  </span>
                )}
              </div>
              <div className="import-line">{exercisesPlural(pending.result.stats.exercises)}</div>
              <div className="import-line">программ: {pending.result.stats.programs}</div>
              <div className="import-line">подходов: {pending.result.stats.sets}</div>
            </div>
            {data.workouts.length > 0 && (
              <p className="import-warning">
                Текущие данные ({workoutsPlural(data.workouts.length)}) будут заменены.
              </p>
            )}
            <button className="btn-primary" onClick={doImport}>
              Импортировать
            </button>
          </>
        )}
        {pending && pending.kind === 'native' && (
          <>
            <div className="sheet-title">Бэкап Gym Tracker</div>
            <div className="import-summary">
              <div className="import-line">
                <b>{workoutsPlural(pending.workouts)}</b>
              </div>
            </div>
            {data.workouts.length > 0 && (
              <p className="import-warning">
                Текущие данные ({workoutsPlural(data.workouts.length)}) будут заменены.
              </p>
            )}
            <button className="btn-primary" onClick={doImport}>
              Импортировать
            </button>
          </>
        )}
      </Sheet>

      <ActionSheet
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Удалить все тренировки, программы и упражнения? Это действие нельзя отменить. Сначала сделай экспорт!"
        actions={[
          {
            label: 'Удалить всё',
            danger: true,
            onClick: () => {
              actions.clearAll();
              showToast('Данные удалены');
            }
          }
        ]}
      />
    </div>
  );
}

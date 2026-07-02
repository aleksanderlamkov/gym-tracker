import { useEffect, useState } from 'react';
import { useAppData } from './store';
import { TabBar, type Tab } from './components/TabBar';
import { DiaryScreen } from './components/diary/DiaryScreen';
import { ProgramsScreen } from './components/programs/ProgramsScreen';
import { ExercisesScreen } from './components/exercises/ExercisesScreen';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { todayISO } from './lib/dates';

export default function App() {
  const data = useAppData();
  const [tab, setTab] = useState<Tab>('diary');
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let timer = 0;
    const handler = (e: Event) => {
      setToast((e as CustomEvent<string>).detail);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setToast(null), 2600);
    };
    window.addEventListener('app-toast', handler);
    return () => {
      window.removeEventListener('app-toast', handler);
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="app">
      <main className="main">
        {tab === 'diary' && (
          <DiaryScreen
            data={data}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onGoPrograms={() => setTab('programs')}
            onGoSettings={() => setTab('settings')}
          />
        )}
        {tab === 'programs' && <ProgramsScreen data={data} />}
        {tab === 'exercises' && <ExercisesScreen data={data} />}
        {tab === 'settings' && <SettingsScreen data={data} />}
      </main>
      <TabBar tab={tab} onChange={setTab} />
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

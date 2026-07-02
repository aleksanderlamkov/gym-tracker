import { Icon, type IconName } from './ui/Icons';

export type Tab = 'diary' | 'programs' | 'exercises' | 'settings';

const TABS: { id: Tab; name: string; icon: IconName }[] = [
  { id: 'diary', name: 'Дневник', icon: 'calendar' },
  { id: 'programs', name: 'Программы', icon: 'program' },
  { id: 'exercises', name: 'Упражнения', icon: 'barbell' },
  { id: 'settings', name: 'Ещё', icon: 'settings' }
];

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={'tab-item' + (tab === t.id ? ' active' : '')}
          onClick={() => onChange(t.id)}
        >
          <Icon name={t.icon} size={23} />
          <span>{t.name}</span>
        </button>
      ))}
    </nav>
  );
}

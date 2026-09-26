import { useState, lazy, Suspense } from 'react';
import { CalendarDays, ChartColumn, House, Settings, type LucideIcon } from 'lucide-react';
import type { BowelEntry, ExerciseEntry, FoodEntry } from './db';
import BowelForm from './forms/BowelForm';
import FoodForm from './forms/FoodForm';
import ExerciseForm from './forms/ExerciseForm';
import Today from './screens/Today';
import SettingsScreen from './screens/SettingsScreen';
import History from './screens/History';

// Stats pulls in the chart library, so it's loaded only when opened.
const Stats = lazy(() => import('./screens/Stats'));

/** Which form is open; `entry` is set when editing an existing one, `at` is the default time for a new one. */
export type Editing =
  | { kind: 'bowel'; entry?: BowelEntry; at?: number }
  | { kind: 'food'; entry?: FoodEntry; at?: number }
  | { kind: 'exercise'; entry?: ExerciseEntry; at?: number };

type Tab = 'today' | 'history' | 'stats' | 'settings';

const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'today', label: 'Home', Icon: House },
  { id: 'history', label: 'History', Icon: CalendarDays },
  { id: 'stats', label: 'Stats', Icon: ChartColumn },
  { id: 'settings', label: 'Settings', Icon: Settings },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [editing, setEditing] = useState<Editing | null>(null);
  const close = () => setEditing(null);

  return (
    <div className="app">
      <main>
        {tab === 'today' && <Today onEdit={setEditing} />}
        {tab === 'history' && <History />}
        {tab === 'settings' && <SettingsScreen />}
        {tab === 'stats' && (
          <Suspense fallback={<div className="screen" />}>
            <Stats />
          </Suspense>
        )}
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            <t.Icon size={22} />
            {t.label}
          </button>
        ))}
      </nav>

      {editing?.kind === 'bowel' && <BowelForm entry={editing.entry} at={editing.at} onClose={close} />}
      {editing?.kind === 'food' && <FoodForm entry={editing.entry} at={editing.at} onClose={close} />}
      {editing?.kind === 'exercise' && <ExerciseForm entry={editing.entry} at={editing.at} onClose={close} />}
    </div>
  );
}

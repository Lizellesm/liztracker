import { useState } from 'react';
import type { BowelEntry, ExerciseEntry, FoodEntry } from './db';
import BowelForm from './forms/BowelForm';
import FoodForm from './forms/FoodForm';
import ExerciseForm from './forms/ExerciseForm';
import Today from './screens/Today';

/** Which form is open; `entry` is set when editing an existing one, `at` is the default time for a new one. */
export type Editing =
  | { kind: 'bowel'; entry?: BowelEntry; at?: number }
  | { kind: 'food'; entry?: FoodEntry; at?: number }
  | { kind: 'exercise'; entry?: ExerciseEntry; at?: number };

type Tab = 'today' | 'history' | 'stats' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '📋' },
  { id: 'history', label: 'History', icon: '📅' },
  { id: 'stats', label: 'Stats', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [editing, setEditing] = useState<Editing | null>(null);
  const close = () => setEditing(null);

  return (
    <div className="app">
      <main>
        {tab === 'today' && <Today onEdit={setEditing} />}
        {tab !== 'today' && (
          <div className="screen">
            <h1>{TABS.find((t) => t.id === tab)!.label}</h1>
            <p className="empty">Coming soon.</p>
          </div>
        )}
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            <span>{t.icon}</span>
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

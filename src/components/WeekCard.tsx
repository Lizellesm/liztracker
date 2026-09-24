import { useLiveQuery } from 'dexie-react-hooks';
import { CalendarDays } from 'lucide-react';
import { db, DEFAULT_SETTINGS, getSettings } from '../db';
import { EXERCISE } from '../constants';
import { addDays, startOfWeek } from '../time';
import { IconBubble } from '../ui';

/** Exercise progress for the week containing `day`, against the weekly goals. */
export default function WeekCard({ day }: { day: number }) {
  const settings = useLiveQuery(getSettings) ?? DEFAULT_SETTINGS;
  const week = startOfWeek(day);
  const sessions = useLiveQuery(
    () => db.exercise.where('timestamp').between(week, addDays(week, 7), true, false).toArray(),
    [week],
  );

  return (
    <section className="card">
      <div className="card-head">
        <IconBubble Icon={CalendarDays} tone="brand" />
        <span className="card-title">Exercise this week</span>
      </div>
      <div className="rings">
        {EXERCISE.map((c) => {
          const goal = settings.goals[c.id];
          const mine = (sessions ?? []).filter((s) => s.categories.includes(c.id));
          const value = goal.unit === 'minutes' ? mine.reduce((sum, s) => sum + (s.minutes[c.id] ?? 0), 0) : mine.length;
          return (
            <div key={c.id} className="ring-item">
              <Ring value={value} target={goal.target} tone={c.id}>
                <c.Icon size={20} />
              </Ring>
              <div className="ring-label">{c.label}</div>
              <div className="muted small">
                {value}/{goal.target}
                {goal.unit === 'minutes' ? ' min' : ''}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Ring({ value, target, tone, children }: { value: number; target: number; tone: string; children: React.ReactNode }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, target ? value / target : 0);
  return (
    <div className={`ring ${tone}`}>
      <svg viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} className="ring-track" />
        <circle
          cx="32"
          cy="32"
          r={r}
          className="ring-fill"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <span className="ring-icon">{children}</span>
    </div>
  );
}

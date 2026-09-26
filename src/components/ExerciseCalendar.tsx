import { Footprints } from 'lucide-react';
import type { Settings } from '../db';
import { EXERCISE } from '../constants';
import { planFor } from '../exerciseLibrary';
import type { DayData } from '../history';
import { addDays } from '../time';
import { IconBubble } from '../ui';

/** History: which F.A.C.E. (and back) categories were done each day of the week, and the week against the goals. */
export default function ExerciseCalendar({
  week,
  days,
  today,
  selected,
  onSelect,
  settings,
}: {
  week: number;
  days: DayData[] | undefined;
  today: number;
  selected: number;
  onSelect: (day: number) => void;
  settings: Settings;
}) {
  const sessions = (days ?? []).flatMap((d) => d.exercise);

  return (
    <section className="card habit-card">
      <div className="card-head">
        <IconBubble Icon={Footprints} tone="exercise" />
        <span className="card-title">Exercise calendar</span>
      </div>

      <div className="habit-grid">
        <span />
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} className="weekday">
            {new Date(addDays(week, i)).toLocaleDateString([], { weekday: 'narrow' })}
          </span>
        ))}

        <span />
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(week, i);
          return (
            <button
              key={i}
              className={`date-cell ${d === selected ? 'selected' : ''} ${d === today ? 'today' : ''}`}
              onClick={() => onSelect(d)}
              disabled={d > today}
            >
              {new Date(d).getDate()}
            </button>
          );
        })}

        {EXERCISE.map((c) => [
          <span key={c.id} className={`habit-icon cat-icon ${c.id}`} title={c.label} aria-label={c.label}>
            {c.letter ?? <c.Icon size={19} />}
          </span>,
          ...Array.from({ length: 7 }, (_, i) => {
            const day = addDays(week, i);
            const done = !!days?.[i]?.exercise.some((e) => e.categories.includes(c.id));
            const planned = planFor(settings.weekPlan, day).some((p) => p.category === c.id);
            return (
              <button
                key={`${c.id}-${i}`}
                className={`dot-cell ${day === selected ? 'selected' : ''}`}
                onClick={() => onSelect(day)}
                disabled={day > today}
                aria-label={`${c.label}: ${done ? 'done' : planned ? 'planned' : 'not done'}`}
              >
                <span className={`dot ${done ? `cat ${c.id}` : planned ? `planned ${c.id}` : 'none'}`} />
              </button>
            );
          }),
        ])}
      </div>

      <div className="legend">
        <span>
          <span className="dot cat stretching" /> Done
        </span>
        <span>
          <span className="dot planned stretching" /> Planned
        </span>
      </div>

      <div className="week-goals">
        {EXERCISE.map((c) => {
          const goal = settings.goals[c.id];
          const mine = sessions.filter((s) => s.categories.includes(c.id));
          const value = goal.unit === 'minutes' ? mine.reduce((sum, s) => sum + (s.minutes[c.id] ?? 0), 0) : mine.length;
          return (
            <span key={c.id} className={`tag cat ${c.id} ${value >= goal.target ? 'met' : ''}`}>
              {c.letter ?? <c.Icon size={14} />} {value}/{goal.target}
              {goal.unit === 'minutes' ? ' min' : ''}
            </span>
          );
        })}
      </div>
    </section>
  );
}

import { useLiveQuery } from 'dexie-react-hooks';
import { Check, Target } from 'lucide-react';
import { db, DEFAULT_SETTINGS, getSettings, type ExerciseCategory, type PlanItem } from '../db';
import { EXERCISE } from '../constants';
import { planFor } from '../exerciseLibrary';
import { addDays, startOfDay } from '../time';

export const planItemText = (item: PlanItem) => [item.groups?.join(' + '), item.note].filter(Boolean).join(' · ');

/**
 * The weekly plan's focus for one day, each ticked once any exercise logged that day covers
 * its category (morning or afternoon). With `onPick`, tapping an item picks that category.
 */
export default function DayPlan({
  day,
  picked,
  onPick,
}: {
  day: number;
  picked?: ExerciseCategory[]; // categories ticked in the open form, counted as done too
  onPick?: (item: PlanItem) => void;
}) {
  const settings = useLiveQuery(getSettings) ?? DEFAULT_SETTINGS;
  const logged = useLiveQuery(async () => {
    const rows = await db.exercise.where('timestamp').between(day, addDays(day, 1), true, false).toArray();
    return new Set(rows.flatMap((e) => e.categories));
  }, [day]);
  const items = planFor(settings.weekPlan, day);
  if (!items.length) return null;

  const isDone = (c: ExerciseCategory) => !!logged?.has(c) || !!picked?.includes(c);
  const left = items.filter((i) => !isDone(i.category)).length;

  return (
    <div className="day-plan">
      <div className="day-plan-head">
        <Target size={18} />
        <strong>{day === startOfDay(Date.now()) ? "Today's plan" : 'Plan for this day'}</strong>
        <span className="muted small right">{left ? `${left} to go` : 'All done ✓'}</span>
      </div>
      <ul>
        {items.map((item, i) => {
          const c = EXERCISE.find((x) => x.id === item.category)!;
          const done = isDone(item.category);
          const body = (
            <>
              <span className={`plan-badge ${c.id}`}>{c.letter ?? <c.Icon size={15} />}</span>
              <span className="plan-text">
                <strong>{c.label}</strong>
                {planItemText(item) && <span className="muted small">{planItemText(item)}</span>}
              </span>
              {done && <Check size={18} className="plan-check" />}
            </>
          );
          return (
            <li key={i} className={done ? 'done' : ''}>
              {onPick ? (
                <button type="button" className="plan-row" onClick={() => onPick(item)}>
                  {body}
                </button>
              ) : (
                <div className="plan-row">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

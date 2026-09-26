import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CalendarRange, Plus, X } from 'lucide-react';
import { DEFAULT_SETTINGS, getSettings, updateSettings, type ExerciseCategory, type PlanItem } from '../db';
import { EXERCISE } from '../constants';
import { DEFAULT_WEEK_PLAN } from '../exerciseLibrary';
import { IconBubble, MultiChips } from '../ui';
import { planItemText } from './DayPlan';
import { WEEKDAYS } from './SupplementsCard';

/** Settings: what to focus on each weekday. */
export default function WeekPlanCard() {
  const settings = useLiveQuery(getSettings) ?? DEFAULT_SETTINGS;
  const [adding, setAdding] = useState<number | null>(null);
  const plan = settings.weekPlan;

  const setDay = (d: number, items: PlanItem[]) => updateSettings({ weekPlan: plan.map((x, i) => (i === d ? items : x)) });

  return (
    <section className="card">
      <div className="card-head">
        <IconBubble Icon={CalendarRange} tone="exercise" />
        <span className="card-title">Weekly exercise plan</span>
      </div>
      <p className="muted small">What to focus on each day. Split it between morning and afternoon however you like; Today's log shows what's left.</p>

      {WEEKDAYS.map((w, d) => (
        <div key={w} className="plan-day">
          <div className="plan-day-name">{w}</div>
          <ul className="plan-items">
            {(plan[d] ?? []).map((item, i) => {
              const c = EXERCISE.find((x) => x.id === item.category)!;
              return (
                <li key={i}>
                  <span className={`plan-badge ${c.id}`}>{c.letter ?? <c.Icon size={15} />}</span>
                  <span className="plan-text">
                    <strong>{c.label}</strong>
                    {planItemText(item) && <span className="muted small">{planItemText(item)}</span>}
                  </span>
                  <button
                    type="button"
                    className="icon-btn ghost"
                    aria-label={`Remove ${c.label} from ${w}`}
                    onClick={() => setDay(d, plan[d].filter((_, j) => j !== i))}
                  >
                    <X size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
          {adding === d ? (
            <PlanItemForm
              library={settings.exerciseLibrary}
              onAdd={(item) => (setDay(d, [...(plan[d] ?? []), item]), setAdding(null))}
              onCancel={() => setAdding(null)}
            />
          ) : (
            <button type="button" className="link-btn" onClick={() => setAdding(d)}>
              <Plus size={16} /> Add to {w}
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        className="btn outline add-btn"
        onClick={() => confirm('Replace your plan with the suggested F.A.C.E. week?') && updateSettings({ weekPlan: DEFAULT_WEEK_PLAN })}
      >
        Reset to the suggested week
      </button>
    </section>
  );
}

function PlanItemForm({
  library,
  onAdd,
  onCancel,
}: {
  library: typeof DEFAULT_SETTINGS.exerciseLibrary;
  onAdd: (item: PlanItem) => void;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState<ExerciseCategory>('cardio');
  const [groups, setGroups] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const options = [...new Set(library.filter((x) => x.category === category && x.group).map((x) => x.group!))];

  return (
    <div className="inline-form">
      <div className="chips">
        {EXERCISE.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chip ${category === c.id ? 'active' : ''}`}
            onClick={() => (setCategory(c.id), setGroups([]))}
          >
            {c.letter && <strong>{c.letter}</strong>} {c.label}
          </button>
        ))}
      </div>
      {options.length > 0 && (
        <>
          <div className="muted small">Focus on (optional)</div>
          <MultiChips value={groups} onChange={setGroups} options={options.map((g) => ({ value: g, label: g }))} />
        </>
      )}
      <input value={note} placeholder="Note (optional), e.g. 30 min" onChange={(e) => setNote(e.target.value)} />
      <div className="inline-actions">
        <button
          type="button"
          className="btn primary compact"
          onClick={() => onAdd({ category, groups: groups.length ? groups : undefined, note: note.trim() || undefined })}
        >
          Add
        </button>
        <button type="button" className="btn outline compact" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

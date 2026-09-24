import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronDown, Minus, Plus } from 'lucide-react';
import { db, updateDay, type DayLog } from '../db';

type Option = { emoji: string; label: string };

// Listed left to right as in the original app. The stored value is the index.
const WELLBEING: Option[] = [
  { emoji: '🤒', label: 'Unwell' },
  { emoji: '😣', label: 'Poor' },
  { emoji: '😒', label: 'Okay' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😁', label: 'Great' },
];
const FEELING: Option[] = [
  { emoji: '🥰', label: 'Great' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😠', label: 'Angry' },
];
const STRESS: Option[] = [
  { emoji: '😌', label: 'Very low' },
  { emoji: '😊', label: 'Low' },
  { emoji: '😐', label: 'Moderate' },
  { emoji: '😰', label: 'High' },
  { emoji: '🤯', label: 'Very high' },
];
const SLEEP: Option[] = [
  { emoji: '😵', label: 'Terrible' },
  { emoji: '😪', label: 'Poor' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😃', label: 'Great' },
];

type ScaleKey = 'wellbeing' | 'feeling' | 'stress' | 'sleep';

/** Collapsible day check-in: well-being, feeling, stress, sleep and weight. Saves on tap. */
export default function MoreAboutDay({ day }: { day: number }) {
  const [open, setOpen] = useState(true);
  const log = useLiveQuery(() => db.days.get(day), [day]);
  // Weight starts from the most recent earlier entry so you only nudge it.
  const lastWeight = useLiveQuery(async () => {
    const earlier = await db.days.where('day').below(day).reverse().filter((d) => d.weightKg !== undefined).first();
    return earlier?.weightKg;
  }, [day]);

  const setScale = (key: ScaleKey, i: number) => updateDay(day, { [key]: log?.[key] === i ? undefined : i });

  return (
    <>
      <button type="button" className={`more-toggle day-more ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
        More about your day
        <ChevronDown size={20} />
      </button>

      {open && (
        <div className="day-grid">
          <Scale className="wide" title="Physical well-being" options={WELLBEING} log={log} field="wellbeing" onPick={setScale} />
          <Scale title="How do you feel today?" options={FEELING} log={log} field="feeling" onPick={setScale} />
          <Scale title="How stressed are you?" options={STRESS} log={log} field="stress" onPick={setScale} />
          <Scale title="Sleep" options={SLEEP} log={log} field="sleep" onPick={setScale} />
          <Weight day={day} value={log?.weightKg} fallback={lastWeight} />
        </div>
      )}
    </>
  );
}

function Scale({
  title,
  options,
  log,
  field,
  onPick,
  className = '',
}: {
  title: string;
  options: Option[];
  log: DayLog | undefined;
  field: ScaleKey;
  onPick: (key: ScaleKey, i: number) => void;
  className?: string;
}) {
  const value = log?.[field];
  return (
    <section className={`day-tile ${className}`}>
      <h3>{title}</h3>
      <div className="faces" style={{ '--count': options.length } as React.CSSProperties}>
        {options.map((o, i) => (
          <button
            key={o.label}
            type="button"
            className={`face ${value === i ? 'active' : ''}`}
            onClick={() => onPick(field, i)}
            aria-label={o.label}
            aria-pressed={value === i}
          >
            {o.emoji}
          </button>
        ))}
      </div>
      <div className="face-label">{value !== undefined ? options[value].label : ' '}</div>
    </section>
  );
}

function Weight({ day, value, fallback }: { day: number; value?: number; fallback?: number }) {
  const shown = value ?? fallback ?? 65;
  const save = (kg: number) => updateDay(day, { weightKg: Math.round(kg * 10) / 10 });
  // While typing, keep the raw text; save when the field loses focus.
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <section className="day-tile">
      <h3>Weight</h3>
      <div className="weight">
        <button type="button" className="weight-btn" onClick={() => save(shown - 0.1)} aria-label="Less">
          <Minus size={20} />
        </button>
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          className={value === undefined ? 'unset' : ''}
          value={draft ?? shown.toFixed(1)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft && Number(draft) > 0) save(Number(draft));
            setDraft(null);
          }}
          aria-label="Weight in kg"
        />
        <span className="muted small">kg</span>
        <button type="button" className="weight-btn" onClick={() => save(shown + 0.1)} aria-label="More">
          <Plus size={20} />
        </button>
      </div>
      <div className="face-label muted small">{value === undefined ? 'Not logged' : ' '}</div>
    </section>
  );
}

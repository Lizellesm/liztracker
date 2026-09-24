import { useLiveQuery } from 'dexie-react-hooks';
import { Minus, Plus, Wind, Zap, type LucideIcon } from 'lucide-react';
import { db, updateDay } from '../db';
import { IconBubble } from '../ui';

const CRAMP_LABELS = ['No discomfort', 'Mild', 'Mild', 'Moderate', 'Moderate', 'Severe', 'Severe'];
const BLOAT_LABELS = ['No bloating', 'Very mild', 'Mild', 'Moderate', 'Strong', 'Severe'];

/** Daily cramps (episodes) and bloating (level) counters for `day`; saved immediately. */
export default function SymptomCards({ day }: { day: number }) {
  const log = useLiveQuery(() => db.days.get(day), [day]);
  const cramps = log?.cramps ?? 0;
  const bloating = log?.bloating ?? 0;

  return (
    <>
      <Counter
        title="Cramps / pain"
        Icon={Zap}
        tone="cramps"
        value={cramps}
        caption="episodes today"
        bars={6}
        label={CRAMP_LABELS[Math.min(cramps, CRAMP_LABELS.length - 1)]}
        onChange={(v) => updateDay(day, { cramps: v })}
      />
      <Counter
        title="Bloating"
        Icon={Wind}
        tone="bloating"
        value={bloating}
        max={5}
        caption="level today"
        bars={5}
        label={BLOAT_LABELS[bloating]}
        onChange={(v) => updateDay(day, { bloating: v })}
      />
    </>
  );
}

function Counter({
  title,
  Icon,
  tone,
  value,
  max,
  caption,
  bars,
  label,
  onChange,
}: {
  title: string;
  Icon: LucideIcon;
  tone: string;
  value: number;
  max?: number;
  caption: string;
  bars: number;
  label: string;
  onChange: (v: number) => void;
}) {
  // 0 = calm, then escalate through three severity colours.
  const level = value === 0 ? 0 : value <= bars / 3 ? 1 : value <= (2 * bars) / 3 ? 2 : 3;
  return (
    <section className="card">
      <div className="card-head">
        <IconBubble Icon={Icon} tone={tone} />
        <span className="card-title">{title}</span>
      </div>
      <div className="counter">
        <button type="button" className="round-btn" onClick={() => onChange(Math.max(0, value - 1))} disabled={value === 0} aria-label="Less">
          <Minus size={22} />
        </button>
        <div className="counter-value">
          <span className="big-number">{value}</span>
          <span className="muted small">{caption}</span>
        </div>
        <button
          type="button"
          className="round-btn"
          onClick={() => onChange(max === undefined ? value + 1 : Math.min(max, value + 1))}
          disabled={max !== undefined && value >= max}
          aria-label="More"
        >
          <Plus size={22} />
        </button>
      </div>
      <div className={`severity level-${level}`}>
        <div className="severity-bars">
          {Array.from({ length: bars }, (_, i) => (
            <span key={i} className={i < value ? 'on' : ''} />
          ))}
        </div>
        <span className="severity-label">{label}</span>
      </div>
    </section>
  );
}

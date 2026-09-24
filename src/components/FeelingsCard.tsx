import { useLiveQuery } from 'dexie-react-hooks';
import {
  FaceAngry,
  FaceGrinning,
  FaceNeutral,
  FaceSlightlyFrowning,
  FaceSlightlySmiling,
  Heart,
  type LucideIcon,
} from 'lucide-react';
import { db, updateDay } from '../db';
import { IconBubble, MultiChips } from '../ui';

export const MOODS: { value: number; label: string; Icon: LucideIcon }[] = [
  { value: 1, label: 'Awful', Icon: FaceAngry },
  { value: 2, label: 'Bad', Icon: FaceSlightlyFrowning },
  { value: 3, label: 'Okay', Icon: FaceNeutral },
  { value: 4, label: 'Good', Icon: FaceSlightlySmiling },
  { value: 5, label: 'Great', Icon: FaceGrinning },
];

const FEELINGS = ['calm', 'happy', 'energetic', 'tired', 'stressed', 'anxious', 'sad', 'irritable', 'in pain'];

/** Mood for the day (1–5) plus any feelings that apply; saved immediately. */
export default function FeelingsCard({ day }: { day: number }) {
  const log = useLiveQuery(() => db.days.get(day), [day]);
  const mood = log?.mood;
  const feelings = log?.feelings ?? [];

  return (
    <section className="card">
      <div className="card-head">
        <IconBubble Icon={Heart} tone="mood" />
        <span className="card-title">Feelings</span>
        {mood && <span className="muted small right">{MOODS[mood - 1].label}</span>}
      </div>

      <div className="moods">
        {MOODS.map((m) => (
          <button
            key={m.value}
            type="button"
            className={`mood mood-${m.value} ${mood === m.value ? 'active' : ''}`}
            // Tapping the selected mood again clears it.
            onClick={() => updateDay(day, { mood: mood === m.value ? undefined : m.value })}
            aria-pressed={mood === m.value}
          >
            <m.Icon size={30} />
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      <MultiChips
        value={feelings}
        onChange={(v) => updateDay(day, { feelings: v })}
        options={[...new Set([...FEELINGS, ...feelings])].map((f) => ({ value: f, label: f }))}
      />
    </section>
  );
}

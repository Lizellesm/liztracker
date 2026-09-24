import { useLiveQuery } from 'dexie-react-hooks';
import { Droplet, Droplets, Minus, Plus } from 'lucide-react';
import { db, DEFAULT_SETTINGS, getSettings, updateDay } from '../db';
import { IconBubble } from '../ui';

export default function WaterCard({ day }: { day: number }) {
  const settings = useLiveQuery(getSettings) ?? DEFAULT_SETTINGS;
  const glasses = useLiveQuery(async () => (await db.days.get(day))?.waterGlasses ?? 0, [day]) ?? 0;
  const goal = settings.waterGoal;
  const set = (n: number) => updateDay(day, { waterGlasses: Math.max(0, n) });

  return (
    <section className="card water-card">
      <div className="card-head">
        <IconBubble Icon={Droplets} tone="water" />
        <span className="card-title">Water</span>
        <span className="muted right">{((glasses * settings.glassMl) / 1000).toFixed(2).replace(/\.?0+$/, '')} L</span>
      </div>

      <div className="water-main">
        <button className="round-btn" onClick={() => set(glasses - 1)} disabled={glasses === 0} aria-label="Remove a glass">
          <Minus size={22} />
        </button>
        <div className="water-count">
          <span className={`big-number ${glasses >= goal ? 'done' : ''}`}>{glasses}</span>
          <span className="muted"> / {goal} glasses</span>
        </div>
        <button className="round-btn primary" onClick={() => set(glasses + 1)} aria-label="Add a glass">
          <Plus size={22} />
        </button>
      </div>

      <div className="droplets">
        {Array.from({ length: Math.max(goal, glasses) }, (_, i) => (
          <button
            key={i}
            className={`droplet ${i < glasses ? 'full' : ''}`}
            // Tapping the last full drop empties it; any other drop fills up to it.
            onClick={() => set(i + 1 === glasses ? i : i + 1)}
            aria-label={`${i + 1} glasses`}
          >
            <Droplet size={22} />
          </button>
        ))}
      </div>
    </section>
  );
}

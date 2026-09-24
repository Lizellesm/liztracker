import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Activity, CalendarDays, ChevronLeft, ChevronRight, Footprints, Leaf, Utensils } from 'lucide-react';
import { db } from '../db';
import { addDays, formatDay, formatLongDate, formatShortDate, startOfDay } from '../time';
import { IconBubble } from '../ui';
import WaterCard from '../components/WaterCard';
import type { Editing } from '../App';

export default function Today({ onEdit }: { onEdit: (e: Editing) => void }) {
  const [day, setDay] = useState(() => startOfDay(Date.now()));
  const isToday = day === startOfDay(Date.now());
  // New entries on a past day get that day's date with the current time of day.
  const defaultTime = () => (isToday ? Date.now() : day + (Date.now() - startOfDay(Date.now())));

  const data = useLiveQuery(async () => {
    const range = [day, addDays(day, 1) - 1] as const;
    const [bowel, food, exercise] = await Promise.all([
      db.bowel.where('timestamp').between(...range, true, true).toArray(),
      db.food.where('timestamp').between(...range, true, true).toArray(),
      db.exercise.where('timestamp').between(...range, true, true).toArray(),
    ]);
    const exerciseMinutes = exercise.reduce(
      (sum, e) => sum + Object.values(e.minutes).reduce((a, m) => a + (m ?? 0), 0),
      0,
    );
    return { food: food.length, exercise: exercise.length, exerciseMinutes, bowel: bowel.length };
  }, [day]);

  return (
    <>
      <header className="app-header">
        <IconBubble Icon={Leaf} tone="brand" size="lg" />
        <div className="brand">
          <div className="brand-name">LizTracker</div>
          <div className="muted small">Gut · Food · Exercise</div>
        </div>
        <button className="date-pill" onClick={() => setDay(startOfDay(Date.now()))}>
          <CalendarDays size={18} />
          {isToday ? 'Today' : formatShortDate(day)}
        </button>
      </header>

      <div className="screen">
        <div className="day-nav">
          <button className="chev" onClick={() => setDay(addDays(day, -1))} aria-label="Previous day">
            <ChevronLeft size={24} />
          </button>
          <div className="day-title">
            <h1>{formatDay(day)}</h1>
            <div className="muted">{formatLongDate(day)}</div>
          </div>
          <button className="chev" onClick={() => setDay(addDays(day, 1))} disabled={isToday} aria-label="Next day">
            <ChevronRight size={24} />
          </button>
        </div>

        <WaterCard day={day} />

        <h2 className="section-title">Quick log</h2>
        <div className="tiles">
          <button className="tile" onClick={() => onEdit({ kind: 'food', at: defaultTime() })}>
            <IconBubble Icon={Utensils} tone="food" />
            <span className="tile-value">{data?.food ?? 0}</span>
            <span className="tile-label">Food</span>
          </button>
          <button className="tile" onClick={() => onEdit({ kind: 'exercise', at: defaultTime() })}>
            <IconBubble Icon={Footprints} tone="exercise" />
            <span className="tile-value">{data?.exerciseMinutes ? `${data.exerciseMinutes}m` : (data?.exercise ?? 0)}</span>
            <span className="tile-label">Exercise</span>
          </button>
          <button className="tile" onClick={() => onEdit({ kind: 'bowel', at: defaultTime() })}>
            <IconBubble Icon={Activity} tone="bowel" />
            <span className="tile-value">{data?.bowel ?? 0}</span>
            <span className="tile-label">Bowel</span>
          </button>
        </div>
      </div>
    </>
  );
}

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Activity, CalendarDays, ChevronLeft, ChevronRight, Footprints, Leaf, Utensils } from 'lucide-react';
import { db } from '../db';
import { BRISTOL, EXERCISE, MEALS, STOOL_COLORS, bristolTone } from '../constants';
import { addDays, formatDay, formatLongDate, formatShortDate, formatTime, startOfDay } from '../time';
import { IconBubble } from '../ui';
import WaterCard from '../components/WaterCard';
import WeekCard from '../components/WeekCard';
import DayNote from '../components/DayNote';
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
    const items: Editing[] = [
      ...food.map((entry) => ({ kind: 'food' as const, entry })),
      ...exercise.map((entry) => ({ kind: 'exercise' as const, entry })),
      ...bowel.map((entry) => ({ kind: 'bowel' as const, entry })),
    ];
    items.sort((a, b) => a.entry!.timestamp - b.entry!.timestamp);
    const exerciseMinutes = exercise.reduce(
      (sum, e) => sum + Object.values(e.minutes).reduce((a, m) => a + (m ?? 0), 0),
      0,
    );
    return { items, food: food.length, exercise: exercise.length, exerciseMinutes, bowel: bowel.length };
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

        <WeekCard day={day} />

        <h2 className="section-title">{isToday ? "Today's log" : 'Log'}</h2>
        {data && data.items.length === 0 && (
          <p className="empty">Nothing logged yet. Tap a tile above to add something.</p>
        )}
        <ul className="timeline">
          {data?.items.map((item) => (
            <li key={`${item.kind}-${item.entry!.id}`}>
              <button className="entry" onClick={() => onEdit(item)}>
                <IconBubble
                  Icon={item.kind === 'food' ? Utensils : item.kind === 'exercise' ? Footprints : Activity}
                  tone={item.kind}
                  size="sm"
                />
                <EntrySummary item={item} />
                <time>{formatTime(item.entry!.timestamp)}</time>
              </button>
            </li>
          ))}
        </ul>

        <DayNote key={day} day={day} />
      </div>
    </>
  );
}

function EntrySummary({ item }: { item: Editing }) {
  switch (item.kind) {
    case 'bowel': {
      const e = item.entry!;
      const b = BRISTOL.find((x) => x.type === e.bristol)!;
      const color = STOOL_COLORS.find((c) => c.id === e.color);
      const flags = [e.blood && 'blood', e.mucus && 'mucus', e.straining && 'straining', e.incomplete && 'incomplete'].filter(Boolean);
      return (
        <div className="summary">
          <div className="summary-title">
            <span className={`badge tone-${bristolTone(e.bristol)}`}>Type {e.bristol}</span> {b.label}
          </div>
          <div className="summary-meta">
            {color && <span className="swatch" style={{ background: color.swatch }} />}
            {color?.label} · {e.amount}
            {e.pain > 0 && ` · pain ${e.pain}/10`}
            {flags.length > 0 && <span className="flag"> · {flags.join(', ')}</span>}
          </div>
          {e.notes && <div className="summary-notes">{e.notes}</div>}
        </div>
      );
    }
    case 'food': {
      const e = item.entry!;
      return (
        <div className="summary">
          <div className="summary-title">
            {MEALS.find((m) => m.id === e.meal)?.label}
            {e.description && <span className="summary-desc">{e.description}</span>}
          </div>
          {e.tags.length > 0 && (
            <div className="summary-meta">
              {e.tags.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </div>
          )}
          {e.notes && <div className="summary-notes">{e.notes}</div>}
        </div>
      );
    }
    case 'exercise': {
      const e = item.entry!;
      return (
        <div className="summary">
          <div className="summary-meta">
            {EXERCISE.filter((c) => e.categories.includes(c.id)).map((c) => (
              <span key={c.id} className={`tag cat ${c.id}`}>
                <c.Icon size={14} /> {c.label}
                {e.minutes[c.id] ? ` · ${e.minutes[c.id]}m` : ''}
              </span>
            ))}
          </div>
          <div className="summary-meta">
            {[e.activity, e.intensity, e.backExercisesDone.length > 0 && e.backExercisesDone.join(', ')].filter(Boolean).join(' · ')}
          </div>
          {e.notes && <div className="summary-notes">{e.notes}</div>}
        </div>
      );
    }
  }
}

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { BRISTOL, EXERCISE, MEALS, STOOL_COLORS, bristolTone } from '../constants';
import { addDays, formatDay, formatTime, startOfDay } from '../time';
import type { Editing } from '../App';

export default function Today({ onEdit }: { onEdit: (e: Editing) => void }) {
  const [day, setDay] = useState(() => startOfDay(Date.now()));
  const isToday = day === startOfDay(Date.now());
  // New entries on a past day get that day's date with the current time of day.
  const defaultTime = () => (isToday ? Date.now() : day + (Date.now() - startOfDay(Date.now())));

  const items = useLiveQuery(async () => {
    const range = [day, addDays(day, 1) - 1] as const;
    const [bowel, food, exercise] = await Promise.all([
      db.bowel.where('timestamp').between(...range, true, true).toArray(),
      db.food.where('timestamp').between(...range, true, true).toArray(),
      db.exercise.where('timestamp').between(...range, true, true).toArray(),
    ]);
    const all: Editing[] = [
      ...bowel.map((entry) => ({ kind: 'bowel' as const, entry })),
      ...food.map((entry) => ({ kind: 'food' as const, entry })),
      ...exercise.map((entry) => ({ kind: 'exercise' as const, entry })),
    ];
    return all.sort((a, b) => a.entry!.timestamp - b.entry!.timestamp);
  }, [day]);

  return (
    <div className="screen">
      <div className="day-nav">
        <button className="icon-btn" onClick={() => setDay(addDays(day, -1))} aria-label="Previous day">
          ‹
        </button>
        <h1>{formatDay(day)}</h1>
        <button className="icon-btn" onClick={() => setDay(addDays(day, 1))} disabled={isToday} aria-label="Next day">
          ›
        </button>
      </div>

      <div className="quick-add">
        <button className="quick bowel" onClick={() => onEdit({ kind: 'bowel', at: defaultTime() })}>
          <span>💩</span>Bowel
        </button>
        <button className="quick food" onClick={() => onEdit({ kind: 'food', at: defaultTime() })}>
          <span>🍽</span>Food
        </button>
        <button className="quick exercise" onClick={() => onEdit({ kind: 'exercise', at: defaultTime() })}>
          <span>🏃</span>Exercise
        </button>
      </div>

      {items && items.length === 0 && <p className="empty">Nothing logged {isToday ? 'yet today' : 'on this day'}.</p>}

      <ul className="timeline">
        {items?.map((item) => (
          <li key={`${item.kind}-${item.entry!.id}`}>
            <button className={`entry ${item.kind}`} onClick={() => onEdit(item)}>
              <time>{formatTime(item.entry!.timestamp)}</time>
              <EntrySummary item={item} />
            </button>
          </li>
        ))}
      </ul>
    </div>
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
            🍽 {MEALS.find((m) => m.id === e.meal)?.label}
            {e.description && `: ${e.description}`}
          </div>
          <div className="summary-meta">
            {e.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
            {e.waterMl ? <span className="tag water">💧 {e.waterMl} ml</span> : null}
          </div>
          {e.notes && <div className="summary-notes">{e.notes}</div>}
        </div>
      );
    }
    case 'exercise': {
      const e = item.entry!;
      return (
        <div className="summary">
          <div className="summary-title">
            {EXERCISE.filter((c) => e.categories.includes(c.id)).map((c) => (
              <span key={c.id} className={`tag cat ${c.id}`}>
                {c.icon} {c.label}
                {e.minutes[c.id] ? ` ${e.minutes[c.id]}m` : ''}
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

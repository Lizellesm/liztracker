import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Droplet,
  FaceSlightlySmiling,
  Footprints,
  Utensils,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { DEFAULT_SETTINGS, getSettings } from '../db';
import { HABITS, loadDays, rate, type Habit } from '../history';
import { addDays, startOfDay, startOfWeek } from '../time';
import AppHeader from '../components/AppHeader';
import DaySummary from '../components/DaySummary';
import DayLogSheet from '../components/DayLogSheet';

const ROWS: Record<Habit, { label: string; Icon: LucideIcon }> = {
  water: { label: 'Water', Icon: Droplet },
  food: { label: 'Food', Icon: Utensils },
  exercise: { label: 'Exercise', Icon: Footprints },
  bowel: { label: 'Bowel', Icon: Activity },
  symptoms: { label: 'Cramps & bloating', Icon: Zap },
  mood: { label: 'Mood', Icon: FaceSlightlySmiling },
};

const fmt = (ts: number, opts: Intl.DateTimeFormatOptions) => new Date(ts).toLocaleDateString([], opts);

export default function History() {
  const today = startOfDay(Date.now());
  const [week, setWeek] = useState(() => startOfWeek(today));
  const [selected, setSelected] = useState(today);
  const [editing, setEditing] = useState<number | null>(null);
  const settings = useLiveQuery(getSettings) ?? DEFAULT_SETTINGS;
  const days = useLiveQuery(() => loadDays(week, 7), [week]);
  const isThisWeek = week === startOfWeek(today);

  const goWeek = (delta: number) => {
    const next = addDays(week, delta * 7);
    setWeek(next);
    // Keep a day selected inside the visible week.
    setSelected(next === startOfWeek(today) ? today : next);
  };

  const weekLabel = `${fmt(week, { day: 'numeric', month: 'short' })} – ${fmt(addDays(week, 6), { day: 'numeric', month: 'short', year: 'numeric' })}`;

  return (
    <>
      <AppHeader
        label={isThisWeek ? 'This week' : fmt(week, { day: 'numeric', month: 'short' })}
        onToday={() => (setWeek(startOfWeek(today)), setSelected(today))}
      />

      <div className="screen">
        <section className="card habit-card">
          <div className="card-head">
            <CalendarDays size={24} className="brand-icon" />
            <span className="card-title">Habit calendar</span>
          </div>

          <div className="week-nav">
            <button className="chev" onClick={() => goWeek(-1)} aria-label="Previous week">
              <ChevronLeft size={22} />
            </button>
            <span>{weekLabel}</span>
            <button className="chev" onClick={() => goWeek(1)} disabled={isThisWeek} aria-label="Next week">
              <ChevronRight size={22} />
            </button>
          </div>

          <div className="habit-grid">
            <span />
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} className="weekday">
                {fmt(addDays(week, i), { weekday: 'narrow' })}
              </span>
            ))}

            <span />
            {Array.from({ length: 7 }, (_, i) => {
              const d = addDays(week, i);
              return (
                <button
                  key={i}
                  className={`date-cell ${d === selected ? 'selected' : ''} ${d === today ? 'today' : ''}`}
                  onClick={() => setSelected(d)}
                  disabled={d > today}
                >
                  {new Date(d).getDate()}
                </button>
              );
            })}

            {HABITS.map((h) => {
              const { Icon, label } = ROWS[h];
              return [
                <span key={h} className="habit-icon" title={label} aria-label={label}>
                  <Icon size={19} />
                </span>,
                ...(days ?? Array.from({ length: 7 }, () => null)).map((d, i) => {
                  const r = d ? rate(h, d, settings) : null;
                  const day = addDays(week, i);
                  return (
                    <button
                      key={`${h}-${i}`}
                      className={`dot-cell ${day === selected ? 'selected' : ''}`}
                      onClick={() => setSelected(day)}
                      disabled={day > today}
                      aria-label={`${label}: ${r ?? 'no data'}`}
                    >
                      <span className={`dot ${r ?? 'none'}`} />
                    </button>
                  );
                }),
              ];
            })}
          </div>

          <div className="legend">
            <span><span className="dot good" /> Good</span>
            <span><span className="dot fair" /> Fair</span>
            <span><span className="dot bad" /> Bad</span>
            <span><span className="dot none" /> No data</span>
          </div>
        </section>

        {days && (
          <DaySummary
            data={days.find((d) => d.day === selected) ?? { day: selected, bowel: [], food: [], exercise: [] }}
            onEdit={() => setEditing(selected)}
          />
        )}
      </div>

      {editing !== null && <DayLogSheet day={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

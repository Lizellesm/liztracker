import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Activity, Droplets, Footprints, Pill, Scale, ThumbsDown, ThumbsUp, Utensils } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { db, DEFAULT_SETTINGS, getSettings, type BowelEntry } from '../db';
import { BRISTOL, EXERCISE, bristolTone } from '../constants';
import { loadDays, type DayData } from '../history';
import {
  adherence,
  categoryDays,
  daysBetween,
  daysSince,
  gapLevel,
  helpEffects,
  regularity,
  streak,
  topFoods,
  tracked,
  whatHelps,
} from '../stats';
import { addDays, formatShortDate, startOfDay, startOfWeek } from '../time';
import { IconBubble, Segmented } from '../ui';
import { oftenLabel } from '../components/SupplementsCard';
import WeekCard from '../components/WeekCard';

type Period = 'week' | 'month' | 'quarter';
const PERIOD_DAYS: Record<Period, number> = { week: 7, month: 30, quarter: 91 };

export default function Stats() {
  const [period, setPeriod] = useState<Period>('month');
  const today = startOfDay(Date.now());
  const n = PERIOD_DAYS[period];
  const from = addDays(today, -(n - 1));
  const settings = useLiveQuery(getSettings) ?? DEFAULT_SETTINGS;
  const allDays = useLiveQuery(() => loadDays(from, n), [from, n]);
  const days = allDays && tracked(allDays);
  // Wrapped so "still loading" (undefined) differs from "no movements yet" ({ last: undefined }).
  const latest = useLiveQuery(async () => ({ last: await db.bowel.orderBy('timestamp').last() }));
  const bowelSince = useLiveQuery(() => db.bowel.where('timestamp').aboveOrEqual(from).sortBy('timestamp'), [from]);
  const backDays = useLiveQuery(async () => {
    const rows = await db.exercise.where('categories').equals('back').toArray();
    return new Set(rows.map((e) => startOfDay(e.timestamp)));
  });

  return (
    <div className="screen">
      <h1 className="page-title">Stats</h1>
      <Segmented
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'week', label: 'Week' },
          { value: 'month', label: 'Month' },
          { value: 'quarter', label: '3 months' },
        ]}
      />

      {days && latest && days.length === 0 && <p className="empty">Nothing logged in this period yet.</p>}

      {allDays && days && latest && days.length > 0 && (
        <>
          <RegularityCard days={days} allDays={allDays} today={today} since={daysSince(latest.last, today)} alertDays={settings.gapAlertDays} period={period} />
          <StoolTypesCard days={days} />
          <WhatHelpsCard days={days} settings={settings} bowel={bowelSince ?? []} />
          <SupplementsStats days={days} settings={settings} />
          <ExerciseStats days={days} today={today} backStreak={backDays ? streak(backDays, today) : 0} />
          <WaterCard days={days} goal={settings.waterGoal} />
          <FoodCard days={days} />
          <WeightCard days={days} />
        </>
      )}
    </div>
  );
}

function CardHead({ Icon, tone, title }: { Icon: typeof Activity; tone: string; title: string }) {
  return (
    <div className="card-head">
      <IconBubble Icon={Icon} tone={tone} />
      <span className="card-title">{title}</span>
    </div>
  );
}

function Tile({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="stat-tile">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Worst stool of a day, as a colour group; constipation (hard) wins over soft. */
function dayTone(d: DayData) {
  if (!d.bowel.length) return 'none';
  const types = d.bowel.map((b) => b.bristol);
  if (types.some((t) => t <= 2)) return 'hard';
  return bristolTone(Math.max(...types));
}

const TONE_LABELS: Record<string, string> = { hard: 'Hard (1–2)', good: 'Normal (3–4)', warn: 'Soft (5–6)', bad: 'Watery (7)', none: 'None' };

function RegularityCard({
  days,
  allDays,
  today,
  since,
  alertDays,
  period,
}: {
  days: DayData[]; // from the first logged day
  allDays: DayData[]; // the whole period, for the day strip
  today: number;
  since: number | undefined;
  alertDays: number;
  period: Period;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const r = regularity(days);
  const level = since === undefined ? 'good' : gapLevel(since, alertDays);
  const lead = daysBetween(startOfWeek(allDays[0].day), allDays[0].day); // blank cells before the first day
  const pickedDay = days.find((d) => d.day === picked);

  return (
    <section className="card">
      <CardHead Icon={Activity} tone="bowel" title="Regularity" />

      <div className={`gap-hero ${level}`}>
        <span className="gap-number">{since ?? '–'}</span>
        <span className="gap-text">
          <strong>
            {since === undefined ? 'No movements logged yet' : since === 0 ? 'Went today' : `${plural(since, 'day')} since your last movement`}
          </strong>
          {level === 'bad' && <span>Time for a sachet? Drink extra water and move a bit today.</span>}
          {level === 'warn' && <span>Keep an eye on it: extra water and a walk can help.</span>}
          {level === 'good' && since !== undefined && <span>On track.</span>}
        </span>
      </div>

      <div className="stat-tiles">
        <Tile value={`${r.daysWith}/${r.days}`} label="days with a movement" />
        <Tile value={r.avgInterval !== undefined ? r.avgInterval.toFixed(1) : '–'} label="days between, on average" />
        <Tile value={r.longestGap} label="longest gap (days)" />
        <Tile value={r.movements} label="movements" />
      </div>

      <div className={`day-strip ${period}`}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((w, i) => (
          <span key={i} className="strip-weekday">
            {w}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} />
        ))}
        {allDays.map((d) => {
          if (d.day < days[0].day) return <span key={d.day} className="strip-cell before" title="Before you started logging" />;
          const tone = dayTone(d);
          const text = `${formatShortDate(d.day)}: ${d.bowel.length ? `${plural(d.bowel.length, 'movement')}, type ${d.bowel.map((b) => b.bristol).join(', ')}` : 'no movement'}`;
          return (
            <button
              key={d.day}
              type="button"
              className={`strip-cell ${tone} ${d.day === picked ? 'picked' : ''} ${d.day === today ? 'today' : ''}`}
              title={text}
              aria-label={text}
              onClick={() => setPicked(d.day === picked ? null : d.day)}
            />
          );
        })}
      </div>
      <p className="muted small strip-detail">
        {pickedDay
          ? `${formatShortDate(pickedDay.day)}: ${pickedDay.bowel.length ? `${plural(pickedDay.bowel.length, 'movement')} · type ${pickedDay.bowel.map((b) => b.bristol).join(', ')}` : 'no movement'}`
          : 'Tap a day for details.'}
      </p>
      <div className="legend">
        {Object.entries(TONE_LABELS).map(([tone, label]) => (
          <span key={tone}>
            <span className={`strip-key ${tone}`} /> {label}
          </span>
        ))}
      </div>
    </section>
  );
}

function StoolTypesCard({ days }: { days: DayData[] }) {
  const { types } = regularity(days);
  const total = types.reduce((a, b) => a + b, 0);
  if (!total) return null;
  const max = Math.max(...types);
  const hard = types[0] + types[1];
  const ideal = types[2] + types[3];
  return (
    <section className="card">
      <CardHead Icon={Activity} tone="bowel" title="Stool types" />
      <p className="muted small">
        {Math.round((ideal / total) * 100)}% ideal (types 3–4) · {Math.round((hard / total) * 100)}% hard (types 1–2)
      </p>
      <ul className="bar-list">
        {BRISTOL.map((b, i) => (
          <li key={b.type} title={`Type ${b.type}: ${types[i]}`}>
            <span className="bar-label">
              <strong>{b.type}</strong> {b.short}
            </span>
            <span className="bar-track">
              {types[i] > 0 && <span className={`bar-fill ${bristolTone(b.type)}`} style={{ width: `${(types[i] / max) * 100}%` }} />}
            </span>
            <span className="bar-value">{types[i]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function WhatHelpsCard({ days, settings, bowel }: { days: DayData[]; settings: typeof DEFAULT_SETTINGS; bowel: BowelEntry[] }) {
  const rows = whatHelps(days, settings);
  const effects = helpEffects(days, settings.medications, bowel);
  return (
    <section className="card">
      <CardHead Icon={Activity} tone="exercise" title="What helps you go" />
      {rows.length ? (
        <table className="compare">
          <thead>
            <tr>
              <th>The day before…</th>
              <th>went</th>
              <th>didn't go</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td>
                  <strong>{r.before}</strong>
                </td>
                <td>{r.without}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="muted small">Log a few more days (with and without a movement) and this compares your water, exercise and fibre.</p>
      )}
      {effects.map((e) => (
        <p key={e.med.id} className="effect-line">
          <Pill size={16} className="inline-icon" /> <strong>{e.med.name}</strong>: taken {plural(e.times, 'time')}
          {e.avgHours !== undefined ? `, a movement followed after about ${Math.round(e.avgHours)} h on average` : ', no movement logged after it yet'}
        </p>
      ))}
    </section>
  );
}

function SupplementsStats({ days, settings }: { days: DayData[]; settings: typeof DEFAULT_SETTINGS }) {
  const rows = adherence(days, settings.medications);
  if (!rows.length) return null;
  return (
    <section className="card">
      <CardHead Icon={Pill} tone="meds" title="Supplements" />
      <ul className="bar-list">
        {rows.map((r) => (
          <li key={r.med.id}>
            <span className="bar-label">
              <strong>{r.med.name}</strong>
              <span className="muted small"> {oftenLabel(r.med)}</span>
            </span>
            {r.due !== undefined ? (
              <span className="bar-track">
                {r.due > 0 && <span className="bar-fill meds" style={{ width: `${(r.taken / r.due) * 100}%` }} />}
              </span>
            ) : (
              <span />
            )}
            <span className="bar-value">{r.due !== undefined ? `${r.taken}/${r.due}` : `${r.taken}×`}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ExerciseStats({ days, today, backStreak }: { days: DayData[]; today: number; backStreak: number }) {
  return (
    <>
      <WeekCard day={today} />
      <section className="card">
        <CardHead Icon={Footprints} tone="exercise" title="Exercise in this period" />
        <div className="stat-tiles">
          <Tile value={backStreak} label={`day${backStreak === 1 ? '' : 's'} in a row of back & posture`} />
          <Tile value={days.filter((d) => d.exercise.length).length} label="days with exercise" />
        </div>
        <div className="week-goals">
          {EXERCISE.map((c) => (
            <span key={c.id} className={`tag cat ${c.id}`}>
              {c.letter ?? <c.Icon size={14} />} {plural(categoryDays(days, c.id), 'day')}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}

function WaterCard({ days, goal }: { days: DayData[]; goal: number }) {
  const logged = days.filter((d) => d.log?.waterGlasses);
  if (!logged.length) return null;
  const avg = logged.reduce((s, d) => s + d.log!.waterGlasses, 0) / logged.length;
  return (
    <section className="card">
      <CardHead Icon={Droplets} tone="water" title="Water" />
      <div className="stat-tiles">
        <Tile value={avg.toFixed(1)} label={`glasses a day (goal ${goal})`} />
        <Tile value={`${logged.filter((d) => d.log!.waterGlasses >= goal).length}/${logged.length}`} label="days goal reached" />
      </div>
    </section>
  );
}

function FoodCard({ days }: { days: DayData[] }) {
  const safe = topFoods(days, 'safe');
  const trigger = topFoods(days, 'trigger');
  if (!safe.length && !trigger.length) return null;
  const list = (items: typeof safe) =>
    items.length ? (
      <ol className="food-top">
        {items.map((f) => (
          <li key={f.name}>
            {f.name} <span className="muted small">×{f.n}</span>
          </li>
        ))}
      </ol>
    ) : (
      <p className="muted small">None yet</p>
    );
  return (
    <section className="card">
      <CardHead Icon={Utensils} tone="food" title="Food" />
      <div className="food-cols">
        <div>
          <div className="food-col-head good">
            <ThumbsUp size={16} /> Safe
          </div>
          {list(safe)}
        </div>
        <div>
          <div className="food-col-head bad">
            <ThumbsDown size={16} /> Triggers
          </div>
          {list(trigger)}
        </div>
      </div>
    </section>
  );
}

function WeightCard({ days }: { days: DayData[] }) {
  const points = days.filter((d) => d.log?.weightKg !== undefined).map((d) => ({ day: d.day, kg: d.log!.weightKg! }));
  if (points.length < 2) return null;
  const kgs = points.map((p) => p.kg);
  return (
    <section className="card">
      <CardHead Icon={Scale} tone="brand" title="Weight" />
      <p className="muted small">
        {points[0].kg.toFixed(1)} → {points[points.length - 1].kg.toFixed(1)} kg
      </p>
      <div className="weight-chart">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickFormatter={(d: number) => formatShortDate(d)} tickLine={false} axisLine={false} minTickGap={24} />
            <YAxis domain={[Math.floor(Math.min(...kgs) - 1), Math.ceil(Math.max(...kgs) + 1)]} tickLine={false} axisLine={false} width={48} />
            <Tooltip labelFormatter={(d) => formatShortDate(Number(d))} formatter={(v) => [`${Number(v).toFixed(1)} kg`, 'Weight']} />
            <Line type="monotone" dataKey="kg" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

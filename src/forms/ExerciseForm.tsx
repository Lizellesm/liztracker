import { useState } from 'react';
import { Check, Footprints } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_SETTINGS, exercisesDone, getSettings, type ExerciseCategory, type ExerciseEntry } from '../db';
import { EXERCISE } from '../constants';
import { Field, TimeField, IconBubble, Segmented, FormShell } from '../ui';
import ExerciseChecklist from '../components/ExerciseChecklist';
import { formatShortDate } from '../time';

const blank = (at: number): ExerciseEntry => ({
  timestamp: at,
  categories: [],
  minutes: {},
  activity: '',
  exercisesDone: [],
  intensity: 'moderate',
  notes: '',
});

export default function ExerciseForm({ entry, at, inline, onClose }: { entry?: ExerciseEntry; at?: number; inline?: boolean; onClose: () => void }) {
  const [e, setE] = useState<ExerciseEntry>(() => {
    const start = entry ?? blank(at ?? Date.now());
    return { ...start, exercisesDone: exercisesDone(start) };
  });
  const set = <K extends keyof ExerciseEntry>(k: K, v: ExerciseEntry[K]) => setE((prev) => ({ ...prev, [k]: v }));
  const settings = useLiveQuery(getSettings) ?? DEFAULT_SETTINGS;
  const done = e.exercisesDone ?? [];
  // Ticked names no longer in the library (deleted since) still show, so they can be unticked.
  const orphans = done.filter((name) => !settings.exerciseLibrary.some((x) => x.name === name));

  const setMinutes = (c: ExerciseCategory, value: string) =>
    set('minutes', { ...e.minutes, [c]: value ? Number(value) : undefined });

  const save = async () => {
    // Drop minutes / back exercises for categories that were un-ticked.
    const minutes = Object.fromEntries(
      Object.entries(e.minutes).filter(([c, m]) => e.categories.includes(c as ExerciseCategory) && m),
    );
    // Drop exercises that only belong to un-ticked categories (a name can be in two, e.g. Side plank).
    const inUse = (n: string) => settings.exerciseLibrary.some((x) => x.name === n && e.categories.includes(x.category));
    const unticked = settings.exerciseLibrary.filter((x) => !inUse(x.name)).map((x) => x.name);
    const { backExercisesDone: _old, ...rest } = e;
    const cardio = e.categories.includes('cardio');
    const treadmillProgram = cardio ? e.treadmillProgram : undefined;
    const distanceKm = cardio && e.distanceKm ? e.distanceKm : undefined;
    await db.exercise.put({
      ...rest,
      minutes,
      exercisesDone: done.filter((n) => !unticked.includes(n)),
      treadmillProgram,
      distanceKm,
      activity: e.activity.trim(),
    });
    onClose();
  };

  return (
    <FormShell
      inline={inline}
      title={entry ? 'Edit exercise' : 'Exercise'}
      Icon={Footprints}
      tone="exercise"
      onClose={onClose}
      onSave={save}
      canSave={e.categories.length > 0}
      onDelete={entry?.id ? async () => (await db.exercise.delete(entry.id!), onClose()) : undefined}
    >
      <TimeField value={e.timestamp} onChange={(ts) => set('timestamp', ts)} />

      <Field label="What did you do? (tick all that apply)">
        <div className="category-grid">
          {EXERCISE.map((c) => {
            const on = e.categories.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                className={`category ${c.id} ${on ? 'active' : ''}`}
                onClick={() => set('categories', on ? e.categories.filter((x) => x !== c.id) : [...e.categories, c.id])}
              >
                {c.letter && <span className="letter">{c.letter}</span>}
                <IconBubble Icon={c.Icon} tone={c.id} />
                {c.label}
                {on && <Check className="check" size={18} strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </Field>

      {e.categories.length > 0 && (
        <Field label="Minutes (optional)">
          <div className="minutes-list">
            {EXERCISE.filter((c) => e.categories.includes(c.id)).map((c) => (
              <label key={c.id} className="minutes-row">
                <span className="minutes-label">
                  <IconBubble Icon={c.Icon} tone={c.id} size="sm" /> {c.label}
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="short"
                  value={e.minutes[c.id] ?? ''}
                  onChange={(ev) => setMinutes(c.id, ev.target.value)}
                />
                <span className="muted">min</span>
              </label>
            ))}
          </div>
        </Field>
      )}

      {EXERCISE.filter((c) => e.categories.includes(c.id)).map((c, i) => (
        <ExerciseChecklist
          key={c.id}
          category={c.id}
          label={c.label}
          settings={settings}
          at={e.timestamp}
          extra={i === 0 ? orphans : []}
          done={done}
          onChange={(v) => set('exercisesDone', v)}
        />
      ))}

      {e.categories.includes('cardio') && (
        <>
          <Field label="Aerobic distance (optional)">
            <div className="minutes-row">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step={0.01}
                className="short"
                value={e.distanceKm ?? ''}
                onChange={(ev) => set('distanceKm', ev.target.value ? Number(ev.target.value) : undefined)}
              />
              <span className="muted">km</span>
              {!!e.distanceKm && !!e.minutes.cardio && (
                <span className="muted small push-right">{speed(e.distanceKm, e.minutes.cardio)}</span>
              )}
            </div>
          </Field>
          <TreadmillField entry={e} onChange={(p) => set('treadmillProgram', p)} />
        </>
      )}

      <Field label="Activity (optional)">
        <input value={e.activity} placeholder="e.g. walk, gym, Pilates" onChange={(ev) => set('activity', ev.target.value)} />
      </Field>

      <Field label="Intensity">
        <Segmented
          value={e.intensity}
          onChange={(v) => set('intensity', v)}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'hard', label: 'Hard' },
          ]}
        />
      </Field>

      <Field label="Notes">
        <textarea rows={2} value={e.notes} onChange={(ev) => set('notes', ev.target.value)} />
      </Field>
    </FormShell>
  );
}

/** Average speed and pace, e.g. "6.0 km/h · 10:00 min/km". */
export function speed(km: number, minutes: number) {
  const paceSec = Math.round((minutes * 60) / km);
  const paceText = `${Math.floor(paceSec / 60)}:${String(paceSec % 60).padStart(2, '0')}`;
  return `${((km / minutes) * 60).toFixed(1)} km/h · ${paceText} min/km`;
}

const PROGRAMS = Array.from({ length: 24 }, (_, i) => i + 1);

/** The treadmill's built-in program (P1–P24), with the one done last time as a reminder. */
function TreadmillField({ entry, onChange }: { entry: ExerciseEntry; onChange: (p: number | undefined) => void }) {
  const last = useLiveQuery(
    () =>
      db.exercise
        .where('timestamp')
        .below(entry.timestamp)
        .reverse()
        .filter((x) => x.id !== entry.id && !!x.treadmillProgram)
        .first(),
    [entry.timestamp, entry.id],
  );

  return (
    <Field label="Treadmill program (optional)">
      {last?.treadmillProgram && (
        <p className="muted small program-last">
          Last time: <strong>P{last.treadmillProgram}</strong> on {formatShortDate(last.timestamp)}
        </p>
      )}
      <div className="program-grid">
        {PROGRAMS.map((p) => (
          <button
            key={p}
            type="button"
            className={`chip ${entry.treadmillProgram === p ? 'active' : ''}`}
            onClick={() => onChange(entry.treadmillProgram === p ? undefined : p)}
          >
            P{p}
          </button>
        ))}
      </div>
    </Field>
  );
}

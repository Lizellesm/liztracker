import { useState } from 'react';
import { Check, Footprints } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_SETTINGS, getSettings, updateSettings, type ExerciseCategory, type ExerciseEntry } from '../db';
import { EXERCISE } from '../constants';
import { AddOption, Field, TimeField, IconBubble, MultiChips, Segmented, FormShell } from '../ui';

const blank = (at: number): ExerciseEntry => ({
  timestamp: at,
  categories: [],
  minutes: {},
  activity: '',
  backExercisesDone: [],
  intensity: 'moderate',
  notes: '',
});

export default function ExerciseForm({ entry, at, inline, onClose }: { entry?: ExerciseEntry; at?: number; inline?: boolean; onClose: () => void }) {
  const [e, setE] = useState<ExerciseEntry>(entry ?? blank(at ?? Date.now()));
  const set = <K extends keyof ExerciseEntry>(k: K, v: ExerciseEntry[K]) => setE((prev) => ({ ...prev, [k]: v }));
  const settings = useLiveQuery(getSettings) ?? DEFAULT_SETTINGS;
  const backOptions = [...new Set([...settings.backExercises, ...e.backExercisesDone])];

  const setMinutes = (c: ExerciseCategory, value: string) =>
    set('minutes', { ...e.minutes, [c]: value ? Number(value) : undefined });

  const addBackExercise = async (name: string) => {
    if (!settings.backExercises.includes(name)) await updateSettings({ backExercises: [...settings.backExercises, name] });
    if (!e.backExercisesDone.includes(name)) set('backExercisesDone', [...e.backExercisesDone, name]);
  };

  const save = async () => {
    // Drop minutes / back exercises for categories that were un-ticked.
    const minutes = Object.fromEntries(
      Object.entries(e.minutes).filter(([c, m]) => e.categories.includes(c as ExerciseCategory) && m),
    );
    const backExercisesDone = e.categories.includes('back') ? e.backExercisesDone : [];
    await db.exercise.put({ ...e, minutes, backExercisesDone, activity: e.activity.trim() });
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

      {e.categories.includes('back') && (
        <Field label="Back exercises done">
          {backOptions.length > 0 ? (
            <MultiChips
              value={e.backExercisesDone}
              onChange={(v) => set('backExercisesDone', v)}
              options={backOptions.map((b) => ({ value: b, label: b }))}
            />
          ) : (
            <p className="muted">Add your physio exercises once and they'll appear here to tick off.</p>
          )}
          <AddOption placeholder="Add an exercise, e.g. Cat-cow" onAdd={addBackExercise} />
        </Field>
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

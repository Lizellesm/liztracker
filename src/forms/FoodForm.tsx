import { useState } from 'react';
import { Utensils } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_SETTINGS, getSettings, updateSettings, type FoodEntry, type Meal } from '../db';
import { MEALS } from '../constants';
import { AddOption, Field, TimeField, MultiChips, Segmented, Sheet } from '../ui';

function guessMeal(ts: number): Meal {
  const h = new Date(ts).getHours();
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h >= 17 && h < 21) return 'dinner';
  return 'snack';
}

const blank = (at: number): FoodEntry => ({
  timestamp: at,
  meal: guessMeal(at),
  description: '',
  tags: [],
  portion: 'medium',
  notes: '',
});

export default function FoodForm({ entry, at, onClose }: { entry?: FoodEntry; at?: number; onClose: () => void }) {
  const [e, setE] = useState<FoodEntry>(entry ?? blank(at ?? Date.now()));
  const set = <K extends keyof FoodEntry>(k: K, v: FoodEntry[K]) => setE((prev) => ({ ...prev, [k]: v }));
  const settings = useLiveQuery(getSettings) ?? DEFAULT_SETTINGS;

  // Show tags from settings plus any old tags on this entry that were since removed.
  const tagOptions = [...new Set([...settings.foodTags, ...e.tags])];

  const addTag = async (tag: string) => {
    const t = tag.toLowerCase();
    if (!settings.foodTags.includes(t)) await updateSettings({ foodTags: [...settings.foodTags, t] });
    if (!e.tags.includes(t)) set('tags', [...e.tags, t]);
  };

  const save = async () => {
    await db.food.put({ ...e, description: e.description.trim() });
    onClose();
  };

  return (
    <Sheet
      title={entry ? 'Edit food' : 'Food & drink'}
      Icon={Utensils}
      tone="food"
      onClose={onClose}
      onSave={save}
      canSave={e.description.trim().length > 0 || e.tags.length > 0}
      onDelete={entry?.id ? async () => (await db.food.delete(entry.id!), onClose()) : undefined}
    >
      <TimeField value={e.timestamp} onChange={(ts) => set('timestamp', ts)} />

      <Field label="Meal">
        <Segmented value={e.meal} onChange={(v) => set('meal', v)} options={MEALS.map((m) => ({ value: m.id, label: m.label }))} />
      </Field>

      <Field label="What did you have?">
        <textarea
          rows={2}
          value={e.description}
          placeholder="e.g. oats with banana, coffee"
          onChange={(ev) => set('description', ev.target.value)}
        />
      </Field>

      <Field label="Tags">
        <MultiChips value={e.tags} onChange={(v) => set('tags', v)} options={tagOptions.map((t) => ({ value: t, label: t }))} />
        <AddOption placeholder="New tag…" onAdd={addTag} />
      </Field>

      <Field label="Portion">
        <Segmented
          value={e.portion}
          onChange={(v) => set('portion', v)}
          options={[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' },
          ]}
        />
      </Field>

      <Field label="Notes">
        <textarea rows={2} value={e.notes} onChange={(ev) => set('notes', ev.target.value)} />
      </Field>
    </Sheet>
  );
}

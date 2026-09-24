import { useState } from 'react';
import { Activity } from 'lucide-react';
import { db, type BowelEntry } from '../db';
import { BRISTOL, STOOL_COLORS, URGENCY, bristolTone } from '../constants';
import { fromInputValue, toInputValue } from '../time';
import { Field, Segmented, Sheet, Toggle } from '../ui';

const blank = (at: number): BowelEntry => ({
  timestamp: at,
  bristol: 4,
  color: 'brown',
  amount: 'medium',
  urgency: 0,
  pain: 0,
  straining: false,
  incomplete: false,
  blood: false,
  mucus: false,
  notes: '',
});

export default function BowelForm({ entry, at, onClose }: { entry?: BowelEntry; at?: number; onClose: () => void }) {
  const [e, setE] = useState<BowelEntry>(entry ?? blank(at ?? Date.now()));
  const set = <K extends keyof BowelEntry>(k: K, v: BowelEntry[K]) => setE((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    await db.bowel.put(e);
    onClose();
  };

  return (
    <Sheet
      title={entry ? 'Edit bowel movement' : 'Bowel movement'}
      Icon={Activity}
      tone="bowel"
      onClose={onClose}
      onSave={save}
      onDelete={entry?.id ? async () => (await db.bowel.delete(entry.id!), onClose()) : undefined}
    >
      <Field label="When">
        <input
          type="datetime-local"
          value={toInputValue(e.timestamp)}
          onChange={(ev) => ev.target.value && set('timestamp', fromInputValue(ev.target.value))}
        />
      </Field>

      <Field label="Bristol type">
        <div className="bristol-list">
          {BRISTOL.map((b) => (
            <button
              key={b.type}
              type="button"
              className={`bristol ${e.bristol === b.type ? 'active' : ''}`}
              onClick={() => set('bristol', b.type)}
            >
              <span className={`bristol-num tone-${bristolTone(b.type)}`}>
                {b.type}
              </span>
              <span className="bristol-text">
                <strong>{b.label}</strong>
                <small>{b.hint}</small>
              </span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Colour">
        <div className="chips">
          {STOOL_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chip ${e.color === c.id ? 'active' : ''}`}
              onClick={() => set('color', c.id)}
            >
              <span className="swatch" style={{ background: c.swatch }} />
              {c.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Amount">
        <Segmented
          value={e.amount}
          onChange={(v) => set('amount', v)}
          options={[
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' },
          ]}
        />
      </Field>

      <Field label="Urgency">
        <Segmented value={e.urgency} onChange={(v) => set('urgency', v)} options={URGENCY.map((l, i) => ({ value: i, label: l }))} />
      </Field>

      <Field label={`Pain: ${e.pain}/10`}>
        <input type="range" min={0} max={10} value={e.pain} onChange={(ev) => set('pain', Number(ev.target.value))} />
      </Field>

      <Field label="Also">
        <div className="chips">
          <Toggle label="Straining" checked={e.straining} onChange={(v) => set('straining', v)} />
          <Toggle label="Incomplete" checked={e.incomplete} onChange={(v) => set('incomplete', v)} />
          <Toggle label="Blood" checked={e.blood} onChange={(v) => set('blood', v)} />
          <Toggle label="Mucus" checked={e.mucus} onChange={(v) => set('mucus', v)} />
        </div>
      </Field>

      <Field label="Notes">
        <textarea rows={2} value={e.notes} onChange={(ev) => set('notes', ev.target.value)} />
      </Field>
    </Sheet>
  );
}

import { useState } from 'react';
import { Activity, ChevronDown } from 'lucide-react';
import { db, type BowelEntry } from '../db';
import { BRISTOL, STOOL_COLORS, URGENCY, bristolTone } from '../constants';
import BristolIcon from '../components/BristolIcon';
import SymptomCards from '../components/SymptomCards';
import { formatDay, startOfDay } from '../time';
import { Field, Segmented, FormShell, TimeField, Toggle } from '../ui';

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

export default function BowelForm({ entry, at, inline, onClose }: { entry?: BowelEntry; at?: number; inline?: boolean; onClose: () => void }) {
  const [e, setE] = useState<BowelEntry>(entry ?? blank(at ?? Date.now()));
  const set = <K extends keyof BowelEntry>(k: K, v: BowelEntry[K]) => setE((prev) => ({ ...prev, [k]: v }));
  const [showMore, setShowMore] = useState(false);
  const selected = BRISTOL.find((b) => b.type === e.bristol)!;

  const save = async () => {
    await db.bowel.put(e);
    onClose();
  };

  return (
    <FormShell
      inline={inline}
      title={entry ? 'Edit bowel movement' : 'Bowel movement'}
      Icon={Activity}
      tone="bowel"
      onClose={onClose}
      onSave={save}
      onDelete={entry?.id ? async () => (await db.bowel.delete(entry.id!), onClose()) : undefined}
    >
      <div className={inline ? 'stack' : 'panel'}>
        <TimeField value={e.timestamp} onChange={(ts) => set('timestamp', ts)} />

        <Field label="Bristol type">
          <div className="bristol-grid">
            {BRISTOL.map((b) => (
              <button
                key={b.type}
                type="button"
                className={`bristol-tile tone-${bristolTone(b.type)} ${e.bristol === b.type ? 'active' : ''}`}
                onClick={() => set('bristol', b.type)}
                aria-label={`Type ${b.type}: ${b.label}`}
              >
                <BristolIcon type={b.type} />
                <span>{b.type}</span>
              </button>
            ))}
          </div>
          <div className={`bristol-selected tone-${bristolTone(e.bristol)}`}>
            {selected.type} — {selected.short}
            <small>{selected.hint}</small>
          </div>
        </Field>

        <Field label="Notes">
          <textarea
            rows={3}
            value={e.notes}
            placeholder="Anything worth remembering?"
            onChange={(ev) => set('notes', ev.target.value)}
          />
        </Field>
      </div>

      <button type="button" className={`more-toggle ${showMore ? 'open' : ''}`} onClick={() => setShowMore(!showMore)}>
        More details (optional)
        <ChevronDown size={20} />
      </button>

      {showMore && (
        <div className={inline ? 'stack' : 'panel'}>
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
            </div>
          </Field>
        </div>
      )}

      {!inline && (
        <>
          <h3 className="sheet-section">
            Symptoms · {formatDay(e.timestamp)}
            <small>Saved straight away, even without a bowel movement</small>
          </h3>
          <SymptomCards day={startOfDay(e.timestamp)} />
        </>
      )}
    </FormShell>
  );
}

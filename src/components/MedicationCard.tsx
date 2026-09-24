import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, Moon, Pill, Plus, Sun, Sunrise, Trash, type LucideIcon } from 'lucide-react';
import { db, DEFAULT_SETTINGS, getSettings, updateDay, updateSettings, type Medication, type MedSchedule } from '../db';
import { Field, IconBubble, Segmented } from '../ui';

const SCHEDULES: { id: MedSchedule; label: string; Icon: LucideIcon; time: string }[] = [
  { id: 'morning', label: 'Morning', Icon: Sunrise, time: '08:00' },
  { id: 'afternoon', label: 'Afternoon', Icon: Sun, time: '13:00' },
  { id: 'night', label: 'Night', Icon: Moon, time: '21:00' },
];

const order = (m: Medication) => SCHEDULES.findIndex((s) => s.id === m.schedule) * 10000 + Number(m.time.replace(':', ''));

/** Medications you take, ticked off per day. The list itself lives in settings. */
export default function MedicationCard({ day }: { day: number }) {
  const settings = useLiveQuery(getSettings) ?? DEFAULT_SETTINGS;
  const taken = useLiveQuery(async () => (await db.days.get(day))?.medsTaken ?? [], [day]) ?? [];
  const [adding, setAdding] = useState(false);
  const meds = [...settings.medications].sort((a, b) => order(a) - order(b));

  const toggle = (id: string) =>
    updateDay(day, { medsTaken: taken.includes(id) ? taken.filter((x) => x !== id) : [...taken, id] });

  const remove = (m: Medication) =>
    confirm(`Remove ${m.name} from your medication list?`) &&
    updateSettings({ medications: settings.medications.filter((x) => x.id !== m.id) });

  return (
    <section className="card">
      <div className="card-head">
        <IconBubble Icon={Pill} tone="meds" />
        <span className="card-title">Daily medication</span>
        {meds.length > 0 && (
          <span className="muted small right">
            {meds.filter((m) => taken.includes(m.id)).length}/{meds.length} taken
          </span>
        )}
      </div>

      {meds.length === 0 && !adding && <p className="muted center">No medications added yet</p>}

      {meds.length > 0 && (
        <ul className="med-list">
          {meds.map((m) => {
            const on = taken.includes(m.id);
            const S = SCHEDULES.find((s) => s.id === m.schedule)!;
            return (
              <li key={m.id} className={`med-row ${on ? 'taken' : ''}`}>
                <button type="button" className="med-main" onClick={() => toggle(m.id)} aria-pressed={on}>
                  <span className="check-circle">{on && <Check size={16} strokeWidth={3} />}</span>
                  <span className="med-text">
                    <strong>{m.name}</strong>
                    <span className="muted small">
                      {m.dosage && `${m.dosage} · `}
                      <S.Icon size={13} /> {S.label} {m.time}
                    </span>
                  </span>
                </button>
                <button type="button" className="icon-btn ghost" onClick={() => remove(m)} aria-label={`Remove ${m.name}`}>
                  <Trash size={17} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {adding ? (
        <MedicationForm
          onCancel={() => setAdding(false)}
          onAdd={async (m) => {
            await updateSettings({ medications: [...settings.medications, m] });
            setAdding(false);
          }}
        />
      ) : (
        <button type="button" className="btn outline add-btn" onClick={() => setAdding(true)}>
          <Plus size={18} /> Add medication
        </button>
      )}
    </section>
  );
}

function MedicationForm({ onAdd, onCancel }: { onAdd: (m: Medication) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [schedule, setSchedule] = useState<MedSchedule>('morning');
  const [time, setTime] = useState('08:00');
  const [timeEdited, setTimeEdited] = useState(false);

  const chooseSchedule = (s: MedSchedule) => {
    setSchedule(s);
    // Follow the schedule's usual time until the user picks their own.
    if (!timeEdited) setTime(SCHEDULES.find((x) => x.id === s)!.time);
  };

  return (
    <div className="inline-form">
      <Field label="Medication name">
        <input value={name} placeholder="e.g. Magnesium" onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <Field label="Dosage (optional)">
        <input value={dosage} placeholder="e.g. 500 mg, 2 tablets" onChange={(e) => setDosage(e.target.value)} />
      </Field>
      <Field label="Schedule">
        <Segmented
          value={schedule}
          onChange={chooseSchedule}
          options={SCHEDULES.map((s) => ({
            value: s.id,
            label: (
              <span className="seg-icon">
                <s.Icon size={16} /> {s.label}
              </span>
            ),
          }))}
        />
      </Field>
      <Field label="Time">
        <label className="time-input">
          <input
            type="time"
            value={time}
            onChange={(e) => {
              setTime(e.target.value);
              setTimeEdited(true);
            }}
          />
        </label>
      </Field>
      <div className="inline-actions">
        <button
          type="button"
          className="btn primary compact"
          disabled={!name.trim()}
          onClick={() => onAdd({ id: crypto.randomUUID(), name: name.trim(), dosage: dosage.trim(), schedule, time })}
        >
          Add
        </button>
        <button type="button" className="btn outline compact" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

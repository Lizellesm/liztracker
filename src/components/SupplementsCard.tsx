import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, Moon, Pencil, Pill, Plus, Sun, Sunrise, Trash, type LucideIcon } from 'lucide-react';
import { db, DEFAULT_SETTINGS, getSettings, isDue, updateDay, updateSettings, type Medication, type MedSchedule } from '../db';
import { startOfDay } from '../time';
import { Field, IconBubble, MultiChips, Segmented, Toggle } from '../ui';

const SCHEDULES: { id: MedSchedule; label: string; Icon: LucideIcon; time: string }[] = [
  { id: 'morning', label: 'Morning', Icon: Sunrise, time: '08:00' },
  { id: 'afternoon', label: 'Afternoon', Icon: Sun, time: '13:00' },
  { id: 'night', label: 'Night', Icon: Moon, time: '21:00' },
];

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WORKDAYS = [0, 1, 2, 3, 4];

type Often = 'daily' | 'workdays' | 'days' | 'asNeeded';

const oftenOf = (m: Medication): Often =>
  m.asNeeded ? 'asNeeded' : !m.days ? 'daily' : m.days.join() === WORKDAYS.join() ? 'workdays' : 'days';

/** "Workdays", "Mon, Wed, Fri", "As needed", … */
export function oftenLabel(m: Medication) {
  const o = oftenOf(m);
  if (o === 'asNeeded') return 'As needed';
  if (o === 'daily') return 'Every day';
  if (o === 'workdays') return 'Workdays';
  return m.days!.map((d) => WEEKDAYS[d]).join(', ');
}

const order = (m: Medication) => SCHEDULES.findIndex((s) => s.id === m.schedule);

/** Supplements for one day: the ones due that day to tick off, plus as-needed and off-day extras. */
export default function SupplementsCard({ day }: { day: number }) {
  const settings = useLiveQuery(getSettings) ?? DEFAULT_SETTINGS;
  const log = useLiveQuery(() => db.days.get(day), [day]);
  const taken = log?.medsTaken ?? [];
  const [editing, setEditing] = useState<Medication | 'new' | null>(null);
  const all = [...settings.medications].sort((a, b) => order(a) - order(b));
  const due = all.filter((m) => isDue(m, day));
  const extra = all.filter((m) => !isDue(m, day)).sort((a, b) => Number(!!b.asNeeded) - Number(!!a.asNeeded));

  const toggle = (id: string) => {
    const at = { ...log?.medsTakenAt };
    if (taken.includes(id)) delete at[id];
    // For a past day, keep today's time of day on that date.
    else at[id] = day === startOfDay(Date.now()) ? Date.now() : day + (Date.now() - startOfDay(Date.now()));
    updateDay(day, { medsTaken: taken.includes(id) ? taken.filter((x) => x !== id) : [...taken, id], medsTakenAt: at });
  };

  const save = async (m: Medication) => {
    const exists = settings.medications.some((x) => x.id === m.id);
    await updateSettings({ medications: exists ? settings.medications.map((x) => (x.id === m.id ? m : x)) : [...settings.medications, m] });
    setEditing(null);
  };

  const remove = (m: Medication) =>
    confirm(`Remove ${m.name} from your supplements?`) &&
    updateSettings({ medications: settings.medications.filter((x) => x.id !== m.id) });

  const row = (m: Medication) => {
    if (editing !== 'new' && editing?.id === m.id)
      return (
        <li key={m.id}>
          <SupplementForm initial={m} onSave={save} onCancel={() => setEditing(null)} />
        </li>
      );
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
              {!m.asNeeded && (
                <>
                  <S.Icon size={13} /> {S.label} ·{' '}
                </>
              )}
              {oftenLabel(m)}
            </span>
          </span>
        </button>
        <button type="button" className="icon-btn ghost" onClick={() => setEditing(m)} aria-label={`Edit ${m.name}`}>
          <Pencil size={16} />
        </button>
        <button type="button" className="icon-btn ghost" onClick={() => remove(m)} aria-label={`Remove ${m.name}`}>
          <Trash size={17} />
        </button>
      </li>
    );
  };

  return (
    <section className="card">
      <div className="card-head">
        <IconBubble Icon={Pill} tone="meds" />
        <span className="card-title">Supplements</span>
        {due.length > 0 && (
          <span className="muted small right">
            {due.filter((m) => taken.includes(m.id)).length}/{due.length} taken
          </span>
        )}
      </div>

      {all.length === 0 && editing !== 'new' && <p className="muted center">No supplements added yet</p>}
      {all.length > 0 && due.length === 0 && <p className="muted small">Nothing due today.</p>}

      {due.length > 0 && <ul className="med-list">{due.map(row)}</ul>}

      {extra.length > 0 && (
        <>
          <div className="med-subhead">Also taken today?</div>
          <ul className="med-list">{extra.map(row)}</ul>
        </>
      )}

      {editing === 'new' ? (
        <SupplementForm onSave={save} onCancel={() => setEditing(null)} />
      ) : (
        <button type="button" className="btn outline add-btn" onClick={() => setEditing('new')}>
          <Plus size={18} /> Add supplement
        </button>
      )}
    </section>
  );
}

function SupplementForm({ initial, onSave, onCancel }: { initial?: Medication; onSave: (m: Medication) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [dosage, setDosage] = useState(initial?.dosage ?? '');
  const [schedule, setSchedule] = useState<MedSchedule>(initial?.schedule ?? 'morning');
  const [often, setOften] = useState<Often>(initial ? oftenOf(initial) : 'daily');
  const [days, setDays] = useState<string[]>((initial?.days ?? [0, 2, 4]).map(String));
  const [helpsGo, setHelpsGo] = useState(!!initial?.helpsGo);

  const submit = () =>
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      dosage: dosage.trim(),
      schedule,
      time: SCHEDULES.find((s) => s.id === schedule)!.time,
      days: often === 'workdays' ? WORKDAYS : often === 'days' ? days.map(Number).sort() : undefined,
      asNeeded: often === 'asNeeded' || undefined,
      helpsGo: (often === 'asNeeded' && helpsGo) || undefined,
    });

  return (
    <div className="inline-form">
      <Field label="Name">
        <input value={name} placeholder="e.g. Calcium, Omega 3" onChange={(e) => setName(e.target.value)} autoFocus={!initial} />
      </Field>
      <Field label="Dosage (optional)">
        <input value={dosage} placeholder="e.g. 500 mg, 1 capsule" onChange={(e) => setDosage(e.target.value)} />
      </Field>
      <Field label="How often">
        <Segmented
          value={often}
          onChange={setOften}
          options={[
            { value: 'daily', label: 'Every day' },
            { value: 'workdays', label: 'Workdays' },
            { value: 'days', label: 'Pick days' },
            { value: 'asNeeded', label: 'As needed' },
          ]}
        />
        {often === 'asNeeded' && (
          <div className="weekday-chips">
            <Toggle label="For constipation (Stats shows how soon it works)" checked={helpsGo} onChange={setHelpsGo} />
          </div>
        )}
        {often === 'days' && (
          <div className="weekday-chips">
            <MultiChips value={days} onChange={setDays} options={WEEKDAYS.map((d, i) => ({ value: String(i), label: d }))} />
          </div>
        )}
      </Field>
      {often !== 'asNeeded' && (
        <Field label="When">
          <Segmented
            value={schedule}
            onChange={setSchedule}
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
      )}
      <div className="inline-actions">
        <button
          type="button"
          className="btn primary compact"
          disabled={!name.trim() || (often === 'days' && days.length === 0)}
          onClick={submit}
        >
          {initial ? 'Save' : 'Add'}
        </button>
        <button type="button" className="btn outline compact" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

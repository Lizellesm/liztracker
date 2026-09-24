import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Activity, Footprints, Plus, type LucideIcon } from 'lucide-react';
import { db } from '../db';
import { addDays, formatDay, formatTime, startOfDay } from '../time';
import { DoneSheet, IconBubble } from '../ui';
import type { Editing } from '../App';
import BowelForm from '../forms/BowelForm';
import ExerciseForm from '../forms/ExerciseForm';
import DayNote from './DayNote';
import EntrySummary from './EntrySummary';
import MoreAboutDay from './MoreAboutDay';
import MealsCard from './MealsCard';
import MedicationCard from './MedicationCard';
import SymptomCards from './SymptomCards';
import WaterCard from './WaterCard';

type Kind = Editing['kind'];

const SECTIONS: { kind: Kind; title: string; add: string; Icon: LucideIcon }[] = [
  { kind: 'exercise', title: 'Exercise', add: 'Add exercise', Icon: Footprints },
  { kind: 'bowel', title: 'Bowel movements', add: 'Add movement', Icon: Activity },
];

/** Everything for one day on a single scrolling page; each card saves as you go. */
export default function DayLogSheet({ day, onClose }: { day: number; onClose: () => void }) {
  // Only one inline form open at a time across the page.
  const [editing, setEditing] = useState<Editing | null>(null);
  const isToday = day === startOfDay(Date.now());
  const defaultTime = () => (isToday ? Date.now() : day + (Date.now() - startOfDay(Date.now())));

  return (
    <DoneSheet title={isToday ? "Today's log" : `Log · ${formatDay(day)}`} onClose={onClose}>
          <WaterCard day={day} />
          <MealsCard day={day} editing={editing?.kind === 'food' ? editing : null} onEdit={setEditing} defaultTime={defaultTime} />
          {SECTIONS.map((s) => (
            <EntrySection
              key={s.kind}
              {...s}
              day={day}
              editing={editing?.kind === s.kind ? editing : null}
              onEdit={setEditing}
              defaultTime={defaultTime}
            />
          ))}
          <SymptomCards day={day} />
          <MedicationCard day={day} />
          <MoreAboutDay day={day} />
          <DayNote key={day} day={day} />
    </DoneSheet>
  );
}

function EntrySection({
  kind,
  title,
  add,
  Icon,
  day,
  editing,
  onEdit,
  defaultTime,
}: {
  kind: Kind;
  title: string;
  add: string;
  Icon: LucideIcon;
  day: number;
  editing: Editing | null;
  onEdit: (e: Editing | null) => void;
  defaultTime: () => number;
}) {
  const items = useLiveQuery(async () => {
    const rows = await db[kind].where('timestamp').between(day, addDays(day, 1), true, false).sortBy('timestamp');
    return rows.map((entry) => ({ kind, entry }) as Editing);
  }, [kind, day]);

  const close = () => onEdit(null);
  const form = (e: Editing) => {
    const props = { inline: true, at: defaultTime(), onClose: close, key: e.entry?.id ?? 'new' };
    if (e.kind === 'exercise') return <ExerciseForm {...props} entry={e.entry} />;
    if (e.kind === 'bowel') return <BowelForm {...props} entry={e.entry} />;
    return null; // food is handled by MealsCard
  };

  return (
    <section className="card">
      <div className="card-head">
        <IconBubble Icon={Icon} tone={kind} />
        <span className="card-title">{title}</span>
        {!!items?.length && <span className="muted small right">{items.length}</span>}
      </div>

      {!!items?.length && (
        <ul className="log-list">
          {items.map((item) =>
            editing && editing.entry?.id === item.entry!.id ? (
              <li key={item.entry!.id}>{form(editing)}</li>
            ) : (
              <li key={item.entry!.id}>
                <button type="button" className="log-row" onClick={() => onEdit(item)}>
                  <time>{formatTime(item.entry!.timestamp)}</time>
                  <EntrySummary item={item} />
                </button>
              </li>
            ),
          )}
        </ul>
      )}

      {editing && !editing.entry ? (
        form(editing)
      ) : (
        <button type="button" className="btn outline add-btn" onClick={() => onEdit({ kind })}>
          <Plus size={18} /> {add}
        </button>
      )}
    </section>
  );
}

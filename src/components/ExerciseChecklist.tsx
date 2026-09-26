import { Fragment, useState } from 'react';
import { Check, ChevronDown, ListChecks, Play, Timer } from 'lucide-react';
import { updateSettings, type ExerciseCategory, type LibraryExercise, type Routine, type Settings } from '../db';
import { planFor, routineExercises } from '../exerciseLibrary';
import { startOfDay } from '../time';
import { hasTimer, timerSteps, unlockSound, type TimerStep } from '../timer';
import { AddOption, Field } from '../ui';
import ExerciseTimer from './ExerciseTimer';

/** A category's library exercises to tick off, with its routines as one-tap shortcuts. */
export default function ExerciseChecklist({
  category,
  label,
  settings,
  at,
  extra,
  done,
  onChange,
}: {
  category: ExerciseCategory;
  label: string;
  settings: Settings;
  at: number; // the entry's time: picks the day's exercises for daily routines
  extra: string[]; // ticked names that aren't in the library any more
  done: string[];
  onChange: (done: string[]) => void;
}) {
  const [naming, setNaming] = useState(false);
  // Other sub-groups (e.g. Carry a load's body areas) start closed unless something in them is ticked.
  // Sub-groups in the day's plan (e.g. Tuesday: legs) show a "Planned" tag and start open.
  const planned = planFor(settings.weekPlan, startOfDay(at))
    .filter((p) => p.category === category)
    .flatMap((p) => p.groups ?? []);
  const [openGroups, setOpenGroups] = useState(() => [
    ...planned,
    ...settings.exerciseLibrary.filter((x) => x.category === category && x.group && done.includes(x.name)).map((x) => x.group!),
  ]);
  const toggleGroup = (g: string) => setOpenGroups((open) => (open.includes(g) ? open.filter((x) => x !== g) : [...open, g]));
  const items = settings.exerciseLibrary.filter((x) => x.category === category);
  const routines = settings.routines.filter((r) => r.category === category);
  const tickedHere = items.filter((x) => done.includes(x.name));

  const [timer, setTimer] = useState<TimerStep[] | null>(null);
  const startTimer = (exercises: LibraryExercise[]) => {
    unlockSound();
    setTimer(exercises.flatMap(timerSteps));
  };
  const closeTimer = (finished: string[]) => {
    setTimer(null);
    if (finished.length) onChange([...new Set([...done, ...finished])]);
  };
  const play = (x: LibraryExercise) => (hasTimer(x) ? () => startTimer([x]) : undefined);

  const toggle = (name: string) => onChange(done.includes(name) ? done.filter((n) => n !== name) : [...done, name]);

  const routineNames = (r: Routine) => routineExercises(r, settings.exerciseLibrary, startOfDay(at)).map((x) => x.name);
  const daily = routines.filter((r) => r.dailyTotal);

  const toggleRoutine = (names: string[], on: boolean) =>
    onChange(on ? done.filter((n) => !names.includes(n)) : [...new Set([...done, ...names])]);

  const addExercise = async (name: string) => {
    if (!items.some((x) => x.name === name)) {
      await updateSettings({
        exerciseLibrary: [...settings.exerciseLibrary, { id: crypto.randomUUID(), category, name, dose: '' }],
      });
    }
    if (!done.includes(name)) onChange([...done, name]);
  };

  const saveRoutine = async (name: string) => {
    const routine = { id: crypto.randomUUID(), category, name, exercises: tickedHere.map((x) => x.id) };
    await updateSettings({ routines: [...settings.routines, routine] });
    setNaming(false);
  };

  return (
    <Field label={`${label} exercises`}>
      {routines.length > 0 && (
        <div className="chips">
          {routines.map((r) => {
            const names = routineNames(r);
            const on = names.length > 0 && names.every((n) => done.includes(n));
            return (
              <button key={r.id} type="button" className={`chip ${on ? 'active' : ''}`} onClick={() => toggleRoutine(names, on)}>
                <ListChecks size={16} /> {r.name}
                {r.dailyTotal ? ` (${names.length})` : ''}
              </button>
            );
          })}
        </div>
      )}

      {daily.map((r) => {
        const today = routineExercises(r, settings.exerciseLibrary, startOfDay(at));
        return (
          <div key={r.id} className="ex-today">
            <div className="ex-today-head">
              <strong>{r.name} for {startOfDay(at) === startOfDay(Date.now()) ? 'today' : 'this day'}</strong>
              <span className="muted small">
                {today.filter((x) => done.includes(x.name)).length}/{today.length}
                {r.note ? ` · ${r.note}` : ''}
              </span>
              <button type="button" className="btn primary compact timer-start" onClick={() => startTimer(today)}>
                <Timer size={18} /> Start timer
              </button>
            </div>
            <ol className="ex-list">
              {today.map((x) => (
                <li key={x.id}>
                  <ExerciseRow
                    exercise={x}
                    done={done.includes(x.name)}
                    onToggle={() => toggle(x.name)}
                    onPlay={play(x)}
                    daily={r.exercises.includes(x.id)}
                  />
                </li>
              ))}
            </ol>
          </div>
        );
      })}

      {items.length + extra.length > 0 ? (
        <>
          {byGroup(items).map(([group, rows]) => {
            const list = (
              <ul className="ex-list">
                {rows.map((x) => (
                  <li key={x.id}>
                    <ExerciseRow exercise={x} done={done.includes(x.name)} onToggle={() => toggle(x.name)} onPlay={play(x)} />
                  </li>
                ))}
              </ul>
            );
            if (!group) return <Fragment key="">{list}</Fragment>;
            const ticked = rows.filter((x) => done.includes(x.name)).length;
            return (
              <details key={group} className="ex-group" open={openGroups.includes(group)}>
                <summary onClick={(ev) => (ev.preventDefault(), toggleGroup(group))}>
                  <span className="setting-label">
                    {group}
                    {planned.includes(group) && <span className="ex-tag book planned-tag">Planned</span>}
                  </span>
                  <span className="muted small">{ticked ? `${ticked} ticked` : rows.length}</span>
                  <ChevronDown size={18} className="lib-chevron" />
                </summary>
                {list}
              </details>
            );
          })}
          {extra.length > 0 && (
            <ul className="ex-list">
              {extra.map((name) => (
                <li key={name}>
                  <button type="button" className="ex-row done" onClick={() => toggle(name)}>
                    <span className="check-circle">
                      <Check size={16} strokeWidth={3} />
                    </span>
                    <span className="ex-text">
                      <strong>{name}</strong>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="muted">Add your exercises once and they'll appear here to tick off.</p>
      )}

      <AddOption placeholder={`Add a ${label.toLowerCase()} exercise`} onAdd={addExercise} />

      {tickedHere.length >= 2 &&
        (naming ? (
          <AddOption placeholder="Routine name, e.g. Evening stretches" button="Save" autoFocus onAdd={saveRoutine} />
        ) : (
          <button type="button" className="link-btn" onClick={() => setNaming(true)}>
            <ListChecks size={16} /> Save the {tickedHere.length} ticked as a routine
          </button>
        ))}

      {timer && (
        <ExerciseTimer steps={timer} restSeconds={settings.timerRestSeconds} speak={settings.timerSpeak} onClose={closeTimer} />
      )}
    </Field>
  );
}

/** Library exercises split by sub-group, in library order; ungrouped ones come first under no heading. */
export function byGroup(items: LibraryExercise[]): [string | undefined, LibraryExercise[]][] {
  const groups = new Map<string | undefined, LibraryExercise[]>();
  if (items.some((x) => !x.group)) groups.set(undefined, []);
  for (const x of items) groups.set(x.group, [...(groups.get(x.group) ?? []), x]);
  return [...groups];
}

function ExerciseRow({
  exercise,
  done,
  onToggle,
  onPlay,
  daily,
}: {
  exercise: LibraryExercise;
  done: boolean;
  onToggle: () => void;
  onPlay?: () => void; // only for exercises with a time
  daily?: boolean;
}) {
  return (
    <div className="ex-row-wrap">
      <button type="button" className={`ex-row ${done ? 'done' : ''}`} onClick={onToggle}>
        <span className="check-circle">{done && <Check size={16} strokeWidth={3} />}</span>
        <ExerciseInfo exercise={exercise} daily={daily} />
      </button>
      {onPlay && (
        <button type="button" className="ex-play" onClick={onPlay} aria-label={`Timer for ${exercise.name}`}>
          <Play size={18} />
        </button>
      )}
    </div>
  );
}

/** Name, amount and tags of a library exercise. */
export function ExerciseInfo({ exercise: x, daily }: { exercise: LibraryExercise; daily?: boolean }) {
  return (
    <span className="ex-text">
      <strong>{x.name}</strong>
      {(x.dose || x.source || x.equipment || x.level || daily) && (
        <span className="ex-dose">
          {x.dose}
          {daily && <span className="ex-tag book">Every day</span>}
          {x.source && <span className={`ex-tag ${x.source}`}>{x.source === 'book' ? 'Book' : 'Plan'}</span>}
          {x.level && <span className="ex-tag level">{x.level === 'later' ? 'Later' : 'Optional'}</span>}
          {x.equipment && <span className="ex-tag equipment">{x.equipment}</span>}
        </span>
      )}
      {x.note && <span className="muted small">{x.note}</span>}
    </span>
  );
}

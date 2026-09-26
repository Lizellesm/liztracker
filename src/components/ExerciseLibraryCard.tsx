import { Fragment, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { BookOpen, ChevronDown, ListChecks, Trash2 } from 'lucide-react';
import { DEFAULT_SETTINGS, getSettings, updateSettings, type LibraryExercise } from '../db';
import { EXERCISE } from '../constants';
import { IconBubble, Segmented } from '../ui';
import { byGroup, ExerciseInfo } from './ExerciseChecklist';

/** Settings: edit the exercise library and delete routines, one collapsible group per category. */
export default function ExerciseLibraryCard() {
  const settings = useLiveQuery(getSettings) ?? DEFAULT_SETTINGS;
  const [editing, setEditing] = useState<string | null>(null);

  const saveExercise = async (x: LibraryExercise) => {
    // Logged days store names, so a rename changes the library only, not past days.
    await updateSettings({ exerciseLibrary: settings.exerciseLibrary.map((y) => (y.id === x.id ? x : y)) });
    setEditing(null);
  };

  const deleteExercise = async (x: LibraryExercise) => {
    if (!confirm(`Delete "${x.name}" from your library? Days you already logged keep it.`)) return;
    await updateSettings({
      exerciseLibrary: settings.exerciseLibrary.filter((y) => y.id !== x.id),
      routines: settings.routines.map((r) => ({ ...r, exercises: r.exercises.filter((id) => id !== x.id) })),
    });
    setEditing(null);
  };

  const deleteRoutine = async (id: string, name: string) => {
    if (confirm(`Delete the routine "${name}"? Its exercises stay in the library.`))
      await updateSettings({ routines: settings.routines.filter((r) => r.id !== id) });
  };

  return (
    <section className="card">
      <div className="card-head">
        <IconBubble Icon={BookOpen} tone="exercise" />
        <span className="card-title">Exercise library</span>
      </div>
      <p className="muted small">
        Exercises you can tick off when you log exercise. Add new ones from the exercise form; tick a few there to save them as a
        routine.
      </p>

      {EXERCISE.map((c) => {
        const items = settings.exerciseLibrary.filter((x) => x.category === c.id);
        const routines = settings.routines.filter((r) => r.category === c.id);
        return (
          <details key={c.id} className="lib-group">
            <summary>
              <IconBubble Icon={c.Icon} tone={c.id} size="sm" />
              <span className="setting-label">
                {c.letter && `${c.letter} · `}
                {c.label}
              </span>
              <span className="muted small">{items.length}</span>
              <ChevronDown size={18} className="lib-chevron" />
            </summary>

            {routines.length > 0 && (
              <ul className="ex-list">
                {routines.map((r) => (
                  <li key={r.id} className="lib-routine">
                    <ListChecks size={18} />
                    <span className="ex-text">
                      <strong>{r.name}</strong>
                      <span className="muted small">
                        {r.dailyTotal
                          ? `${r.dailyTotal} a day: ${r.exercises.length} every day, the rest rotating`
                          : `${r.exercises.length} exercises`}
                        {r.note ? ` · ${r.note}` : ''}
                      </span>
                    </span>
                    <button type="button" className="icon-btn ghost" aria-label={`Delete ${r.name}`} onClick={() => deleteRoutine(r.id, r.name)}>
                      <Trash2 size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {items.length === 0 && <p className="muted small">No exercises yet.</p>}
            {byGroup(items).map(([group, rows]) => (
              <Fragment key={group ?? ''}>
                {group && <div className="lib-subhead">{group}</div>}
                <ul className="ex-list">
                  {rows.map((x) =>
                    editing === x.id ? (
                      <li key={x.id}>
                        <ExerciseEditor
                          exercise={x}
                          onSave={saveExercise}
                          onCancel={() => setEditing(null)}
                          onDelete={() => deleteExercise(x)}
                        />
                      </li>
                    ) : (
                      <li key={x.id}>
                        <button type="button" className="ex-row" onClick={() => setEditing(x.id)}>
                          <ExerciseInfo exercise={x} />
                        </button>
                      </li>
                    ),
                  )}
                </ul>
              </Fragment>
            ))}
          </details>
        );
      })}
    </section>
  );
}

function ExerciseEditor({
  exercise,
  onSave,
  onCancel,
  onDelete,
}: {
  exercise: LibraryExercise;
  onSave: (x: LibraryExercise) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const [x, setX] = useState(exercise);
  const set = <K extends keyof LibraryExercise>(k: K, v: LibraryExercise[K]) => setX((prev) => ({ ...prev, [k]: v }));
  const source = x.source ?? 'none';

  return (
    <div className="inline-form">
      <input value={x.name} placeholder="Name" onChange={(e) => set('name', e.target.value)} />
      <input value={x.dose} placeholder="Time or repetitions, e.g. 30 sec × 4" onChange={(e) => set('dose', e.target.value)} />
      <Segmented
        value={source}
        onChange={(v) => set('source', v === 'none' ? undefined : v)}
        options={[
          { value: 'book', label: 'From the book' },
          { value: 'plan', label: 'My plan' },
          { value: 'none', label: 'None' },
        ]}
      />
      <input value={x.equipment ?? ''} placeholder="Equipment (optional), e.g. Band + anchor" onChange={(e) => set('equipment', e.target.value)} />
      <Segmented
        value={x.level ?? 'start'}
        onChange={(v) => set('level', v === 'start' ? undefined : v)}
        options={[
          { value: 'start', label: 'Starter' },
          { value: 'optional', label: 'Optional' },
          { value: 'later', label: 'Later' },
        ]}
      />
      <input value={x.note ?? ''} placeholder="Note (optional)" onChange={(e) => set('note', e.target.value)} />
      <div className="inline-actions">
        <button
          type="button"
          className="btn primary compact"
          disabled={!x.name.trim()}
          onClick={() => onSave({ ...x, name: x.name.trim(), dose: x.dose.trim(), note: x.note?.trim() || undefined, equipment: x.equipment?.trim() || undefined })}
        >
          Save
        </button>
        <button type="button" className="btn outline compact" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="btn danger compact push-right" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

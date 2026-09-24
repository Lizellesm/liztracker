import { BRISTOL, EXERCISE, MEALS, bristolTone } from '../constants';
import type { Editing } from '../App';

/** One-line-ish description of a logged entry (used in day lists). */
export default function EntrySummary({ item }: { item: Editing }) {
  switch (item.kind) {
    case 'bowel': {
      const e = item.entry!;
      const b = BRISTOL.find((x) => x.type === e.bristol)!;
      const extras = [e.pain > 0 && `pain ${e.pain}/10`, e.straining && 'straining', e.incomplete && 'incomplete'].filter(Boolean);
      return (
        <div className="summary">
          <div className="summary-title">
            <span className={`badge tone-${bristolTone(e.bristol)}`}>Type {e.bristol}</span> {b.short}
          </div>
          {extras.length > 0 && <div className="summary-meta">{extras.join(' · ')}</div>}
          {e.notes && <div className="summary-notes">{e.notes}</div>}
        </div>
      );
    }
    case 'food': {
      const e = item.entry!;
      return (
        <div className="summary">
          <div className="summary-title">
            {MEALS.find((m) => m.id === e.meal)?.label}
            {e.description && <span className="summary-desc">{e.description}</span>}
          </div>
          {e.tags.length > 0 && (
            <div className="summary-meta">
              {e.tags.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </div>
          )}
          {e.notes && <div className="summary-notes">{e.notes}</div>}
        </div>
      );
    }
    case 'exercise': {
      const e = item.entry!;
      return (
        <div className="summary">
          <div className="summary-meta">
            {EXERCISE.filter((c) => e.categories.includes(c.id)).map((c) => (
              <span key={c.id} className={`tag cat ${c.id}`}>
                <c.Icon size={14} /> {c.label}
                {e.minutes[c.id] ? ` · ${e.minutes[c.id]}m` : ''}
              </span>
            ))}
          </div>
          <div className="summary-meta">
            {[e.activity, e.intensity, e.backExercisesDone.length > 0 && e.backExercisesDone.join(', ')].filter(Boolean).join(' · ')}
          </div>
          {e.notes && <div className="summary-notes">{e.notes}</div>}
        </div>
      );
    }
  }
}

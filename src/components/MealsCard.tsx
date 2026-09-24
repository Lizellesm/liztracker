import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Pencil, Plus, ThumbsDown, ThumbsUp, Trash, UtensilsCrossed } from 'lucide-react';
import { db, type FoodEntry, type Meal } from '../db';
import { MEALS, guessMeal } from '../constants';
import { addDays, startOfDay } from '../time';
import { IconBubble } from '../ui';
import FoodForm from '../forms/FoodForm';
import type { Editing } from '../App';

/** "Today's meals": quick add by meal, grouped list with safe/trigger marking. */
export default function MealsCard({
  day,
  editing,
  onEdit,
  defaultTime,
}: {
  day: number;
  editing: Editing | null; // a food entry being edited in full, if any
  onEdit: (e: Editing | null) => void;
  defaultTime: () => number;
}) {
  const [adding, setAdding] = useState(false);
  const foods = useLiveQuery(
    () => db.food.where('timestamp').between(day, addDays(day, 1), true, false).sortBy('timestamp'),
    [day],
  );

  const setVerdict = (f: FoodEntry, v: FoodEntry['verdict']) => db.food.update(f.id!, { verdict: f.verdict === v ? undefined : v });
  const remove = (f: FoodEntry) => confirm(`Delete "${f.description || 'this item'}"?`) && db.food.delete(f.id!);

  const safe = foods?.filter((f) => f.verdict === 'safe').length ?? 0;
  const triggers = foods?.filter((f) => f.verdict === 'trigger').length ?? 0;

  return (
    <section className="card">
      <div className="card-head">
        <IconBubble Icon={UtensilsCrossed} tone="food" />
        <span className="card-title">{day === startOfDay(Date.now()) ? "Today's meals" : 'Meals'}</span>
      </div>

      {adding && <QuickAdd defaultTime={defaultTime} onDone={() => setAdding(false)} />}

      {MEALS.map((m) => {
        const items = foods?.filter((f) => f.meal === m.id) ?? [];
        if (!items.length) return null;
        return (
          <div key={m.id} className="meal-group">
            <div className="meal-group-head">
              <span className="meal-dot">
                <m.Icon size={15} />
              </span>
              {m.label}
            </div>
            <ul className="log-list">
              {items.map((f) =>
                editing?.entry?.id === f.id ? (
                  <li key={f.id}>
                    <FoodForm inline entry={f} onClose={() => onEdit(null)} />
                  </li>
                ) : (
                  <li key={f.id} className="meal-row">
                    <span className="meal-name">
                      {f.description || f.tags.join(', ') || 'Food'}
                      {f.tags.length > 0 && f.description && <small>{f.tags.join(' · ')}</small>}
                    </span>
                    <button
                      type="button"
                      className={`meal-btn safe ${f.verdict === 'safe' ? 'on' : ''}`}
                      onClick={() => setVerdict(f, 'safe')}
                      aria-label="Mark as safe"
                      aria-pressed={f.verdict === 'safe'}
                    >
                      <ThumbsUp size={19} />
                    </button>
                    <button
                      type="button"
                      className={`meal-btn trigger ${f.verdict === 'trigger' ? 'on' : ''}`}
                      onClick={() => setVerdict(f, 'trigger')}
                      aria-label="Mark as trigger"
                      aria-pressed={f.verdict === 'trigger'}
                    >
                      <ThumbsDown size={19} />
                    </button>
                    <button type="button" className="meal-btn" onClick={() => onEdit({ kind: 'food', entry: f })} aria-label="Edit">
                      <Pencil size={18} />
                    </button>
                    <button type="button" className="meal-btn" onClick={() => remove(f)} aria-label="Delete">
                      <Trash size={18} />
                    </button>
                  </li>
                ),
              )}
            </ul>
          </div>
        );
      })}

      {!adding && (
        <button type="button" className="btn outline add-btn" onClick={() => setAdding(true)}>
          <Plus size={18} /> Add
        </button>
      )}

      {!!foods?.length && (
        <div className="verdict-counts">
          <span className="verdict-pill safe">
            <ThumbsUp size={16} /> Safe: {safe}
          </span>
          <span className="verdict-pill trigger">
            <ThumbsDown size={16} /> Triggers: {triggers}
          </span>
        </div>
      )}
    </section>
  );
}

function QuickAdd({ defaultTime, onDone }: { defaultTime: () => number; onDone: () => void }) {
  const [meal, setMeal] = useState<Meal>(() => guessMeal(defaultTime()));
  const [text, setText] = useState('');

  const add = async () => {
    const description = text.trim();
    if (!description) return;
    await db.food.add({ timestamp: defaultTime(), meal, description, tags: [], portion: 'medium', notes: '' });
    // Stay open so several items can be added in a row.
    setText('');
  };

  return (
    <div className="quick-add-panel">
      <div className="meal-picker">
        {MEALS.slice(0, 4).map((m) => (
          <button key={m.id} type="button" className={`meal-choice ${meal === m.id ? 'active' : ''}`} onClick={() => setMeal(m.id)}>
            <m.Icon size={22} />
            {m.label}
          </button>
        ))}
      </div>
      <input
        className="eat-input"
        value={text}
        placeholder="What did you eat?"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && add()}
        autoFocus
      />
      <div className="quick-add-actions">
        <button type="button" className="btn ghost-btn" onClick={onDone}>
          Close
        </button>
        <button type="button" className="btn primary" disabled={!text.trim()} onClick={add}>
          Add
        </button>
      </div>
    </div>
  );
}

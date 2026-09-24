import { useEffect, useRef, useState } from 'react';
import { NotebookPen } from 'lucide-react';
import { db, updateDay } from '../db';
import { startOfDay } from '../time';

const MAX = 500;

/** Free-text note for the day; saves automatically shortly after typing stops. */
export default function DayNote({ day }: { day: number }) {
  const [text, setText] = useState('');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    db.days.get(day).then((d) => !cancelled && setText(d?.note ?? ''));
    return () => {
      cancelled = true;
    };
  }, [day]);

  const change = (value: string) => {
    setText(value);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => updateDay(day, { note: value }), 400);
  };

  return (
    <section className="card soft">
      <div className="card-head">
        <NotebookPen size={22} />
        <span className="card-title">{day === startOfDay(Date.now()) ? "Today's notes" : 'Notes'}</span>
      </div>
      <textarea
        rows={3}
        maxLength={MAX}
        value={text}
        placeholder="How are you feeling today?"
        onChange={(e) => change(e.target.value)}
        onBlur={() => (clearTimeout(timer.current), updateDay(day, { note: text }))}
      />
      <div className="muted small right">
        {text.length}/{MAX}
      </div>
    </section>
  );
}

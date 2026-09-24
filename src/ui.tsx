import { useState, type ReactNode } from 'react';
import { Clock, X, type LucideIcon } from 'lucide-react';
import { formatTime, fromInputValue, toInputValue } from './time';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      {children}
    </div>
  );
}

interface Option<T> {
  value: T;
  label: ReactNode;
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className={o.value === value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function MultiChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T[];
  onChange: (v: T[]) => void;
}) {
  const toggle = (v: T) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="chips">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={`chip ${value.includes(o.value) ? 'active' : ''}`}
          onClick={() => toggle(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Inline "+ add" input that appends a new option (e.g. a custom food tag). */
export function AddOption({ placeholder, onAdd }: { placeholder: string; onAdd: (v: string) => void }) {
  const [text, setText] = useState('');
  const add = () => {
    const v = text.trim();
    if (v) onAdd(v);
    setText('');
  };
  return (
    <div className="add-option">
      <input
        value={text}
        placeholder={placeholder}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
      />
      <button type="button" className="btn small" onClick={add} disabled={!text.trim()}>
        Add
      </button>
    </div>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" className={`chip ${checked ? 'active' : ''}`} onClick={() => onChange(!checked)}>
      {checked ? '✓ ' : ''}
      {label}
    </button>
  );
}

/**
 * "When" for an entry: uses the given time unless "Enter time manually" is ticked.
 * Starts ticked when the time isn't roughly now (editing an entry, or logging for a past day).
 */
export function TimeField({ value, onChange }: { value: number; onChange: (ts: number) => void }) {
  const [manual, setManual] = useState(() => Math.abs(Date.now() - value) > 60_000);
  return (
    <div className="time-field">
      <button type="button" className={`radio-row ${manual ? 'on' : ''}`} onClick={() => setManual(!manual)}>
        <span className="radio" />
        <Clock size={20} />
        {manual ? 'Enter time manually' : `Now, ${formatTime(value)} (tap to change)`}
      </button>
      {manual && (
        <input
          type="datetime-local"
          value={toInputValue(value)}
          onChange={(ev) => ev.target.value && onChange(fromInputValue(ev.target.value))}
        />
      )}
    </div>
  );
}

/** Pastel circle with a line icon, as used on cards and tiles. */
export function IconBubble({ Icon, tone, size = 'md' }: { Icon: LucideIcon; tone: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={`bubble ${tone} ${size}`}>
      <Icon strokeWidth={2} />
    </span>
  );
}

export function Sheet({
  title,
  Icon,
  tone,
  onClose,
  onSave,
  onDelete,
  canSave = true,
  children,
}: {
  title: string;
  Icon: LucideIcon;
  tone: string;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
  canSave?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (canSave) onSave();
        }}
      >
        <header className="sheet-header">
          <IconBubble Icon={Icon} tone={tone} />
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>
        <div className="sheet-body">{children}</div>
        <footer className="sheet-footer">
          {onDelete && (
            <button
              type="button"
              className="btn danger"
              onClick={() => confirm('Delete this entry?') && onDelete()}
            >
              Delete
            </button>
          )}
          <button type="submit" className="btn primary" disabled={!canSave}>
            Save
          </button>
        </footer>
      </form>
    </div>
  );
}

/** Wraps a log form: a bottom sheet on its own, or an inline panel inside the "Today's log" page. */
export function FormShell({
  inline,
  ...props
}: {
  inline?: boolean;
  title: string;
  Icon: LucideIcon;
  tone: string;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
  canSave?: boolean;
  children: ReactNode;
}) {
  if (!inline) return <Sheet {...props} />;
  const { title, onClose, onSave, onDelete, canSave = true, children } = props;
  return (
    <div className="inline-form">
      <div className="inline-form-title">{title}</div>
      {children}
      <div className="inline-actions">
        <button type="button" className="btn primary compact" disabled={!canSave} onClick={onSave}>
          Save
        </button>
        <button type="button" className="btn outline compact" onClick={onClose}>
          Cancel
        </button>
        {onDelete && (
          <button type="button" className="btn danger compact push-right" onClick={() => confirm('Delete this entry?') && onDelete()}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

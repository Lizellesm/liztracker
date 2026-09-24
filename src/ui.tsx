import { useState, type ReactNode } from 'react';
import { X, type LucideIcon } from 'lucide-react';

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

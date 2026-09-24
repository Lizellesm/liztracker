import { CalendarDays, Leaf } from 'lucide-react';
import { IconBubble } from '../ui';

/** Logo, app name and a date pill that jumps back to today. */
export default function AppHeader({ label, onToday }: { label: string; onToday: () => void }) {
  return (
    <header className="app-header">
      <IconBubble Icon={Leaf} tone="brand" size="lg" />
      <div className="brand">
        <div className="brand-name">LizTracker</div>
        <div className="muted small">Gut · Food · Exercise</div>
      </div>
      <button className="date-pill" onClick={onToday}>
        <CalendarDays size={18} />
        {label}
      </button>
    </header>
  );
}

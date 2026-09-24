const pad = (n: number) => String(n).padStart(2, '0');

/** Timestamp → value for <input type="datetime-local"> (local time). */
export function toInputValue(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromInputValue(value: string) {
  return new Date(value).getTime();
}

export function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function addDays(ts: number, days: number) {
  const d = new Date(ts);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

export function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDay(ts: number) {
  const today = startOfDay(Date.now());
  const day = startOfDay(ts);
  if (day === today) return 'Today';
  if (day === addDays(today, -1)) return 'Yesterday';
  return new Date(ts).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Monday 00:00 of the week containing `ts`. */
export function startOfWeek(ts: number) {
  const day = startOfDay(ts);
  const weekday = (new Date(day).getDay() + 6) % 7; // Mon = 0
  return addDays(day, -weekday);
}

export function formatLongDate(ts: number) {
  return new Date(ts).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatShortDate(ts: number) {
  return new Date(ts).toLocaleDateString([], { day: 'numeric', month: 'short' });
}

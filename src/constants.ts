import { Coffee, Cookie, CupSoda, Dumbbell, Flower2, HeartPulse, Moon, PersonStanding, Sun, type LucideIcon } from 'lucide-react';
import type { ExerciseCategory, Meal } from './db';

export const BRISTOL = [
  { type: 1, short: 'Hard lumps', label: 'Separate hard lumps', hint: 'Severe constipation' },
  { type: 2, short: 'Lumpy', label: 'Lumpy, sausage-shaped', hint: 'Mild constipation' },
  { type: 3, short: 'Cracked', label: 'Sausage with cracks', hint: 'Normal' },
  { type: 4, short: 'Smooth', label: 'Smooth, soft sausage', hint: 'Ideal' },
  { type: 5, short: 'Soft blobs', label: 'Soft blobs, clear edges', hint: 'Lacking fibre' },
  { type: 6, short: 'Mushy', label: 'Mushy, ragged edges', hint: 'Mild diarrhoea' },
  { type: 7, short: 'Watery', label: 'Watery, no solid pieces', hint: 'Diarrhoea' },
];

/** Colour group for a Bristol type: hard (1–2), good (3–4), soft (5–6), watery (7). */
export function bristolTone(type: number) {
  if (type <= 2) return 'hard';
  if (type <= 4) return 'good';
  if (type <= 6) return 'warn';
  return 'bad';
}

export const STOOL_COLORS = [
  { id: 'brown', label: 'Brown', swatch: '#7a4b26' },
  { id: 'dark-brown', label: 'Dark brown', swatch: '#4a2e18' },
  { id: 'light-brown', label: 'Light brown', swatch: '#b0804f' },
  { id: 'yellow', label: 'Yellow', swatch: '#d4b23a' },
  { id: 'green', label: 'Green', swatch: '#5b7a2e' },
  { id: 'pale', label: 'Pale / clay', swatch: '#d9cfbf' },
  { id: 'black', label: 'Black', swatch: '#1c1a19' },
  { id: 'red', label: 'Red', swatch: '#a12b22' },
];

export const URGENCY = ['None', 'Mild', 'Urgent', 'Very urgent'];

// In the order of the day. Quick-add shows the first four, like the original app.
export const MEALS: { id: Meal; label: string; Icon: LucideIcon }[] = [
  { id: 'breakfast', label: 'Breakfast', Icon: Coffee },
  { id: 'lunch', label: 'Lunch', Icon: Sun },
  { id: 'snack', label: 'Snack', Icon: Cookie },
  { id: 'dinner', label: 'Dinner', Icon: Moon },
  { id: 'drink', label: 'Drink', Icon: CupSoda },
];

export function guessMeal(ts: number): Meal {
  const h = new Date(ts).getHours();
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h >= 17 && h < 21) return 'dinner';
  return 'snack';
}

export const EXERCISE: { id: ExerciseCategory; label: string; Icon: LucideIcon }[] = [
  { id: 'back', label: 'Back', Icon: PersonStanding },
  { id: 'strength', label: 'Strength', Icon: Dumbbell },
  { id: 'cardio', label: 'Cardio', Icon: HeartPulse },
  { id: 'stretching', label: 'Stretching', Icon: Flower2 },
];

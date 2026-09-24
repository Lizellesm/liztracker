import { Dumbbell, HeartPulse, PersonStanding, Flower2, type LucideIcon } from 'lucide-react';
import type { ExerciseCategory, Meal } from './db';

export const BRISTOL = [
  { type: 1, label: 'Separate hard lumps', hint: 'Severe constipation' },
  { type: 2, label: 'Lumpy, sausage-shaped', hint: 'Mild constipation' },
  { type: 3, label: 'Sausage with cracks', hint: 'Normal' },
  { type: 4, label: 'Smooth, soft sausage', hint: 'Ideal' },
  { type: 5, label: 'Soft blobs, clear edges', hint: 'Lacking fibre' },
  { type: 6, label: 'Mushy, ragged edges', hint: 'Mild diarrhoea' },
  { type: 7, label: 'Watery, no solid pieces', hint: 'Diarrhoea' },
];

export function bristolTone(type: number) {
  if (type <= 2) return 'warn';
  if (type <= 5) return 'good';
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

export const MEALS: { id: Meal; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' },
  { id: 'drink', label: 'Drink' },
];

export const EXERCISE: { id: ExerciseCategory; label: string; Icon: LucideIcon }[] = [
  { id: 'back', label: 'Back', Icon: PersonStanding },
  { id: 'strength', label: 'Strength', Icon: Dumbbell },
  { id: 'cardio', label: 'Cardio', Icon: HeartPulse },
  { id: 'stretching', label: 'Stretching', Icon: Flower2 },
];

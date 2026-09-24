import Dexie, { type EntityTable } from 'dexie';

export type Size = 'small' | 'medium' | 'large';
export type Intensity = 'light' | 'moderate' | 'hard';
export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink';
export type ExerciseCategory = 'back' | 'strength' | 'cardio' | 'stretching';

export interface BowelEntry {
  id?: number;
  timestamp: number;
  bristol: number; // 1–7
  color: string;
  amount: Size;
  urgency: number; // 0–3
  pain: number; // 0–10
  straining: boolean;
  incomplete: boolean;
  blood: boolean;
  mucus: boolean;
  notes: string;
}

export interface FoodEntry {
  id?: number;
  timestamp: number;
  meal: Meal;
  description: string;
  tags: string[];
  portion: Size;
  waterMl?: number;
  notes: string;
}

export interface ExerciseEntry {
  id?: number;
  timestamp: number;
  categories: ExerciseCategory[];
  minutes: Partial<Record<ExerciseCategory, number>>;
  activity: string;
  backExercisesDone: string[];
  intensity: Intensity;
  notes: string;
}

/** Per-day values that aren't separate events. `day` is the local midnight timestamp. */
export interface DayLog {
  day: number;
  waterGlasses: number;
  note: string;
  cramps?: number; // episodes that day
  bloating?: number; // level 0–5
  medsTaken?: string[]; // Medication ids ticked off that day
  mood?: number; // 1 (awful) – 5 (great)
  feelings?: string[];
}

export type MedSchedule = 'morning' | 'afternoon' | 'night';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  schedule: MedSchedule;
  time: string; // "HH:MM"
}

export interface Goal {
  target: number;
  unit: 'sessions' | 'minutes';
}

export interface Settings {
  id: 'settings';
  foodTags: string[];
  backExercises: string[];
  goals: Record<ExerciseCategory, Goal>;
  waterGoal: number; // glasses per day
  glassMl: number;
  medications: Medication[];
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  foodTags: ['dairy', 'gluten', 'spicy', 'fried', 'caffeine', 'alcohol', 'high-fibre', 'sugar'],
  backExercises: [],
  goals: {
    back: { target: 5, unit: 'sessions' },
    strength: { target: 3, unit: 'sessions' },
    cardio: { target: 150, unit: 'minutes' },
    stretching: { target: 5, unit: 'sessions' },
  },
  waterGoal: 8,
  glassMl: 250,
  medications: [],
};

export const db = new Dexie('liztracker') as Dexie & {
  bowel: EntityTable<BowelEntry, 'id'>;
  food: EntityTable<FoodEntry, 'id'>;
  exercise: EntityTable<ExerciseEntry, 'id'>;
  settings: EntityTable<Settings, 'id'>;
  days: EntityTable<DayLog, 'day'>;
};

db.version(1).stores({
  bowel: '++id, timestamp',
  food: '++id, timestamp, *tags',
  exercise: '++id, timestamp, *categories',
  settings: 'id',
});

db.version(2).stores({
  days: 'day',
});

export async function updateDay(day: number, changes: Partial<Omit<DayLog, 'day'>>) {
  const current = (await db.days.get(day)) ?? { day, waterGlasses: 0, note: '' };
  await db.days.put({ ...current, ...changes });
}

export async function getSettings(): Promise<Settings> {
  const s = await db.settings.get('settings');
  return { ...DEFAULT_SETTINGS, ...s };
}

export async function updateSettings(changes: Partial<Omit<Settings, 'id'>>) {
  const current = await getSettings();
  await db.settings.put({ ...current, ...changes });
}

// Ask the browser not to evict our data when the phone is low on storage.
export async function requestPersistentStorage() {
  if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
    await navigator.storage.persist();
  }
}

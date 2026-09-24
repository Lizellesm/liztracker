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

export interface Goal {
  target: number;
  unit: 'sessions' | 'minutes';
}

export interface Settings {
  id: 'settings';
  foodTags: string[];
  backExercises: string[];
  goals: Record<ExerciseCategory, Goal>;
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
};

export const db = new Dexie('liztracker') as Dexie & {
  bowel: EntityTable<BowelEntry, 'id'>;
  food: EntityTable<FoodEntry, 'id'>;
  exercise: EntityTable<ExerciseEntry, 'id'>;
  settings: EntityTable<Settings, 'id'>;
};

db.version(1).stores({
  bowel: '++id, timestamp',
  food: '++id, timestamp, *tags',
  exercise: '++id, timestamp, *categories',
  settings: 'id',
});

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

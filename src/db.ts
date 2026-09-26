import Dexie, { type EntityTable } from 'dexie';
import { DEFAULT_LIBRARY, DEFAULT_ROUTINES, DEFAULT_WEEK_PLAN } from './exerciseLibrary';

export type Size = 'small' | 'medium' | 'large';
export type Intensity = 'light' | 'moderate' | 'hard';
export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink';
// F.A.C.E. (Vonda Wright): stretching = Flexibility, cardio = Aerobic, strength = Carrying load, balance = Equilibrium.
export type ExerciseCategory = 'back' | 'strength' | 'cardio' | 'stretching' | 'balance';

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
  verdict?: 'safe' | 'trigger'; // how your gut took it
}

export interface ExerciseEntry {
  id?: number;
  timestamp: number;
  categories: ExerciseCategory[];
  minutes: Partial<Record<ExerciseCategory, number>>;
  activity: string;
  exercisesDone?: string[]; // names of library exercises ticked off
  backExercisesDone?: string[]; // older entries, before the library existed
  treadmillProgram?: number; // the treadmill's built-in program, P1–P24
  distanceKm?: number; // aerobic distance
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
  medsTaken?: string[]; // Medication (supplement) ids ticked off that day
  medsTakenAt?: Record<string, number>; // when each was ticked, e.g. to see how soon a sachet works
  // "More about your day" scales: index into the option lists in MoreAboutDay.tsx
  wellbeing?: number;
  feeling?: number;
  stress?: number;
  sleep?: number;
  weightKg?: number;
}

export type MedSchedule = 'morning' | 'afternoon' | 'night';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  schedule: MedSchedule;
  time: string; // "HH:MM"
  days?: number[]; // weekdays it's due, Mon = 0 … Sun = 6; not set = every day
  asNeeded?: boolean; // only sometimes (e.g. creatine, a sachet): never "due"
  helpsGo?: boolean; // taken for constipation: Stats shows how soon a movement followed
}

/** Whether a supplement is due on `day` (a local-midnight timestamp). */
export function isDue(m: Medication, day: number) {
  if (m.asNeeded) return false;
  return !m.days || m.days.includes((new Date(day).getDay() + 6) % 7);
}

/** An exercise in the library, e.g. "Hip circles", 30 sec each direction. */
export interface LibraryExercise {
  id: string;
  category: ExerciseCategory;
  name: string;
  dose: string; // time or repetitions
  source?: 'book' | 'plan'; // amount from the book, or a practical starting amount
  note?: string;
  group?: string; // sub-heading within the category, e.g. "Core and lower back"
  equipment?: string;
  level?: 'optional' | 'later'; // not set = part of the starting set
}

/** A named set of library exercises that can be ticked off in one tap. */
export interface Routine {
  id: string;
  category: ExerciseCategory;
  name: string;
  exercises: string[]; // LibraryExercise ids
  // Daily rotation: `exercises` are done every day, topped up to this many with the category's
  // other exercises, reshuffled each week so every one comes up during the week.
  dailyTotal?: number;
  note?: string;
}

/** One focus in the weekly exercise plan, e.g. Carrying load · Glutes, quads and knees. */
export interface PlanItem {
  category: ExerciseCategory;
  groups?: string[]; // library sub-groups to focus on; not set = the whole category
  note?: string; // e.g. "30 min", "stretch after aerobic"
}

export interface Goal {
  target: number;
  unit: 'sessions' | 'minutes';
}

export interface Settings {
  id: 'settings';
  foodTags: string[];
  backExercises: string[]; // replaced by exerciseLibrary; read once to migrate
  exerciseLibrary: LibraryExercise[];
  routines: Routine[];
  weekPlan: PlanItem[][]; // Mon = 0 … Sun = 6
  seeded?: string[]; // ids of starting exercises/routines already added, so deleted ones stay deleted
  goals: Record<ExerciseCategory, Goal>;
  waterGoal: number; // glasses per day
  glassMl: number;
  medications: Medication[];
  timerRestSeconds: number; // exercise timer: rest between exercises and sides
  timerSpeak: boolean; // exercise timer: say the next exercise out loud
  gapAlertDays: number; // Stats warns after this many days without a movement
  lastBackupAt?: number;
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'settings',
  foodTags: ['dairy', 'gluten', 'spicy', 'fried', 'caffeine', 'alcohol', 'high-fibre', 'sugar'],
  backExercises: [],
  exerciseLibrary: DEFAULT_LIBRARY,
  routines: DEFAULT_ROUTINES,
  weekPlan: DEFAULT_WEEK_PLAN,
  goals: {
    back: { target: 5, unit: 'sessions' },
    strength: { target: 3, unit: 'sessions' },
    cardio: { target: 150, unit: 'minutes' },
    stretching: { target: 5, unit: 'sessions' },
    balance: { target: 3, unit: 'sessions' },
  },
  waterGoal: 8,
  glassMl: 250,
  medications: [],
  timerRestSeconds: 10,
  timerSpeak: true,
  gapAlertDays: 3,
};

/** Names of the library exercises ticked in an entry (older entries only had back exercises). */
export const exercisesDone = (e: ExerciseEntry) => e.exercisesDone ?? e.backExercisesDone ?? [];

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
  const settings = { ...DEFAULT_SETTINGS, ...s, goals: { ...DEFAULT_SETTINGS.goals, ...s?.goals } };
  if (!s?.exerciseLibrary) {
    // Before the library, back exercises were a plain list of names.
    const back = (s?.backExercises ?? []).map((name): LibraryExercise => ({ id: `back-${name}`, category: 'back', name, dose: '' }));
    settings.exerciseLibrary = [...DEFAULT_LIBRARY, ...back];
  } else {
    // Add starting exercises/routines released since the library was saved.
    const fresh = <T extends { id: string }>(defaults: T[], mine: T[]) =>
      defaults.filter((d) => !s.seeded?.includes(d.id) && !mine.some((x) => x.id === d.id));
    settings.exerciseLibrary = [...settings.exerciseLibrary, ...fresh(DEFAULT_LIBRARY, settings.exerciseLibrary)];
    settings.routines = [...settings.routines, ...fresh(DEFAULT_ROUTINES, settings.routines)];
  }
  settings.seeded = [...DEFAULT_LIBRARY, ...DEFAULT_ROUTINES].map((x) => x.id);
  return settings;
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

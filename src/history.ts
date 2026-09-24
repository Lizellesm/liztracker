import { db, type BowelEntry, type DayLog, type ExerciseEntry, type FoodEntry, type Settings } from './db';
import { addDays, startOfDay } from './time';

export interface DayData {
  day: number;
  bowel: BowelEntry[];
  food: FoodEntry[];
  exercise: ExerciseEntry[];
  log?: DayLog;
}

/** All entries for the days in [from, from + count), grouped by day. */
export async function loadDays(from: number, count: number): Promise<DayData[]> {
  const to = addDays(from, count);
  const [bowel, food, exercise, logs] = await Promise.all([
    db.bowel.where('timestamp').between(from, to, true, false).sortBy('timestamp'),
    db.food.where('timestamp').between(from, to, true, false).sortBy('timestamp'),
    db.exercise.where('timestamp').between(from, to, true, false).sortBy('timestamp'),
    db.days.where('day').between(from, to, true, false).toArray(),
  ]);
  return Array.from({ length: count }, (_, i) => {
    const day = addDays(from, i);
    const same = (e: { timestamp: number }) => startOfDay(e.timestamp) === day;
    return {
      day,
      bowel: bowel.filter(same),
      food: food.filter(same),
      exercise: exercise.filter(same),
      log: logs.find((l) => l.day === day),
    };
  });
}

export type Rating = 'good' | 'fair' | 'bad' | null; // null = no data

export const HABITS = ['water', 'food', 'exercise', 'bowel', 'symptoms', 'mood'] as const;
export type Habit = (typeof HABITS)[number];

export function rate(habit: Habit, d: DayData, settings: Settings): Rating {
  switch (habit) {
    case 'water': {
      const g = d.log?.waterGlasses ?? 0;
      if (!g) return null;
      if (g >= settings.waterGoal) return 'good';
      // Today isn't over yet, so falling short is only "fair" so far.
      return g >= settings.waterGoal / 2 || d.day === startOfDay(Date.now()) ? 'fair' : 'bad';
    }
    case 'food': {
      if (!d.food.length) return null;
      const triggers = d.food.filter((f) => f.verdict === 'trigger').length;
      return triggers === 0 ? 'good' : triggers === 1 ? 'fair' : 'bad';
    }
    case 'exercise': {
      if (!d.exercise.length) return null;
      const minutes = d.exercise.reduce((sum, e) => sum + Object.values(e.minutes).reduce((a, m) => a + (m ?? 0), 0), 0);
      const categories = new Set(d.exercise.flatMap((e) => e.categories)).size;
      return minutes >= 30 || categories >= 2 ? 'good' : 'fair';
    }
    case 'bowel': {
      if (!d.bowel.length) return null;
      const types = d.bowel.map((b) => b.bristol);
      if (types.some((t) => t === 1 || t === 7)) return 'bad';
      if (types.some((t) => t === 2 || t === 5 || t === 6)) return 'fair';
      return 'good';
    }
    case 'symptoms': {
      const { cramps, bloating } = d.log ?? {};
      if (cramps === undefined && bloating === undefined) return null;
      // Cramps: 1–2 mild, 3+ moderate. Bloating: 1–2 mild, 3+ moderate.
      const worst = Math.max(cramps ?? 0, bloating ?? 0);
      return worst === 0 ? 'good' : worst <= 2 ? 'fair' : 'bad';
    }
    case 'mood': {
      // Feeling list runs Great → Angry; well-being runs Unwell → Great.
      const f = d.log?.feeling;
      if (f !== undefined) return f <= 1 ? 'good' : f === 2 ? 'fair' : 'bad';
      const w = d.log?.wellbeing;
      if (w !== undefined) return w >= 3 ? 'good' : w === 2 ? 'fair' : 'bad';
      return null;
    }
  }
}

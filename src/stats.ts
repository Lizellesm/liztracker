import { isDue, type BowelEntry, type ExerciseCategory, type Medication, type Settings } from './db';
import type { DayData } from './history';
import { addDays, startOfDay } from './time';

/** Whole days from `from` to `to` (both local midnights), safe across daylight-saving changes. */
export const daysBetween = (from: number, to: number) => Math.round((to - from) / 86_400_000);

const hasData = (d: DayData) => d.bowel.length > 0 || d.food.length > 0 || d.exercise.length > 0 || !!d.log;

/** Drops the days before anything was logged, so they don't count as days without a movement. */
export function tracked(days: DayData[]) {
  const first = days.findIndex(hasData);
  return first === -1 ? [] : days.slice(first);
}

export interface Regularity {
  movements: number;
  daysWith: number;
  days: number;
  avgInterval?: number; // days from one movement day to the next (1 = daily)
  longestGap: number; // most days in a row without a movement
  types: number[]; // count per Bristol type, index 0 = type 1
}

/** `days` must be in date order and end with today. */
export function regularity(days: DayData[]): Regularity {
  const withMovement = days.filter((d) => d.bowel.length);
  let run = 0;
  let longestGap = 0;
  for (const d of days) {
    run = d.bowel.length ? 0 : run + 1;
    longestGap = Math.max(longestGap, run);
  }
  const types = Array.from({ length: 7 }, () => 0);
  for (const b of days.flatMap((d) => d.bowel)) types[b.bristol - 1]++;
  const n = withMovement.length;
  return {
    movements: days.reduce((sum, d) => sum + d.bowel.length, 0),
    daysWith: n,
    days: days.length,
    avgInterval: n >= 2 ? daysBetween(withMovement[0].day, withMovement[n - 1].day) / (n - 1) : undefined,
    longestGap,
    types,
  };
}

/** Days since the last movement ever logged (0 = today), or undefined if there are none. */
export function daysSince(last: BowelEntry | undefined, today: number) {
  return last ? daysBetween(startOfDay(last.timestamp), today) : undefined;
}

export type GapLevel = 'good' | 'warn' | 'bad';
export const gapLevel = (days: number, alertDays: number): GapLevel =>
  days >= alertDays ? 'bad' : days >= alertDays - 1 && days > 1 ? 'warn' : 'good';

export interface Compare {
  label: string;
  before: string; // on days before a movement
  without: string; // on days before a day without one
}

/**
 * Habits on the day before a movement versus the day before a day without one.
 * Needs at least 3 of each, so returns [] until there's enough data.
 */
export function whatHelps(days: DayData[], settings: Settings): Compare[] {
  const pairs = days.slice(0, -1).map((d, i) => ({ d, went: days[i + 1].bowel.length > 0 }));
  const went = pairs.filter((p) => p.went).map((p) => p.d);
  const not = pairs.filter((p) => !p.went).map((p) => p.d);
  if (went.length < 3 || not.length < 3) return [];

  const avgWater = (ds: DayData[]) => {
    const logged = ds.filter((d) => d.log?.waterGlasses);
    return logged.length ? (logged.reduce((s, d) => s + d.log!.waterGlasses, 0) / logged.length).toFixed(1) : '–';
  };
  const share = (ds: DayData[], test: (d: DayData) => boolean) => `${Math.round((ds.filter(test).length / ds.length) * 100)}%`;
  const fibre = (d: DayData) => d.food.some((f) => f.tags.some((t) => /fib/i.test(t)));

  return [
    { label: `Water (glasses, goal ${settings.waterGoal})`, before: avgWater(went), without: avgWater(not) },
    { label: 'Days with exercise', before: share(went, (d) => d.exercise.length > 0), without: share(not, (d) => d.exercise.length > 0) },
    { label: 'Days with high-fibre food', before: share(went, fibre), without: share(not, fibre) },
  ];
}

export interface HelpEffect {
  med: Medication;
  times: number;
  avgHours?: number; // until the next movement, over the times one followed
}

/** For supplements marked "for constipation": how many times taken and how soon a movement followed. */
export function helpEffects(days: DayData[], meds: Medication[], after: BowelEntry[]): HelpEffect[] {
  return meds
    .filter((m) => m.helpsGo)
    .map((med) => {
      const takenAt = days.flatMap((d) => (d.log?.medsTaken?.includes(med.id) ? [d.log.medsTakenAt?.[med.id] ?? d.day + 12 * 3_600_000] : []));
      const hours = takenAt
        .map((t) => after.find((b) => b.timestamp > t)?.timestamp)
        .map((next, i) => (next ? (next - takenAt[i]) / 3_600_000 : undefined))
        .filter((h): h is number => h !== undefined);
      return { med, times: takenAt.length, avgHours: hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : undefined };
    })
    .filter((e) => e.times > 0);
}

export interface Adherence {
  med: Medication;
  taken: number;
  due?: number; // not set for as-needed supplements
}

export function adherence(days: DayData[], meds: Medication[]): Adherence[] {
  return meds.map((med) => {
    const taken = days.filter((d) => d.log?.medsTaken?.includes(med.id)).length;
    if (med.asNeeded) return { med, taken };
    const dueDays = days.filter((d) => isDue(med, d.day));
    return { med, taken: dueDays.filter((d) => d.log?.medsTaken?.includes(med.id)).length, due: dueDays.length };
  });
}

/** Days in a row with a category done, counting back from today (or yesterday, if today isn't done yet). */
export function streak(doneDays: Set<number>, today: number) {
  let day = doneDays.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (doneDays.has(day)) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

export const categoryDays = (days: DayData[], c: ExerciseCategory) => days.filter((d) => d.exercise.some((e) => e.categories.includes(c))).length;

/** Most-logged foods rated safe or trigger, most frequent first. */
export function topFoods(days: DayData[], verdict: 'safe' | 'trigger', count = 3) {
  const tally = new Map<string, { name: string; n: number }>();
  for (const f of days.flatMap((d) => d.food)) {
    if (f.verdict !== verdict || !f.description.trim()) continue;
    const key = f.description.trim().toLowerCase();
    const t = tally.get(key) ?? { name: f.description.trim(), n: 0 };
    tally.set(key, { ...t, n: t.n + 1 });
  }
  return [...tally.values()].sort((a, b) => b.n - a.n).slice(0, count);
}

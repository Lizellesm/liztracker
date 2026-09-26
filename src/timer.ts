import type { LibraryExercise } from './db';

/** One timed (or, with no `seconds`, "tap when done") block of an exercise, e.g. Bird-dog · Left. */
export interface TimerStep {
  exercise: LibraryExercise;
  label?: string; // "Left", "Right · 2 of 4", …
  seconds?: number;
  rest?: number; // rest before this step, when not the usual rest time
  last: boolean; // last step of this exercise: finishing it ticks the exercise off
}

/**
 * Reads the time from an exercise's amount: "1 min each side" → Left 60 s, Right 60 s;
 * "At least 30 sec × 4" → 4 × 30 s; "8 × 5-sec holds" → 8 × 5 s. Amounts that start with a
 * repetition count ("10 each leg, hold 5 sec") have no timer: the step waits for "Done".
 */
export function timerSteps(x: LibraryExercise): TimerStep[] {
  const d = x.dose.toLowerCase();

  // Intervals, e.g. "30 min: 2 min jog + 3 min walk × 6": alternate with no rest in between.
  const iv = d.match(/(\d+)\s*min\s+([a-z ]+?)\s*\+\s*(\d+)\s*min\s+([a-z ]+?)\s*×\s*(\d+)/);
  if (iv) {
    const [, aMin, aName, bMin, bName, times] = iv;
    const n = Number(times);
    const cap = (t: string) => t[0].toUpperCase() + t.slice(1);
    return Array.from({ length: n }, (_, i) => [
      { exercise: x, label: `${cap(aName)} · ${i + 1} of ${n}`, seconds: Number(aMin) * 60, rest: 0, last: false },
      { exercise: x, label: `${cap(bName)} · ${i + 1} of ${n}`, seconds: Number(bMin) * 60, rest: 0, last: i === n - 1 },
    ]).flat();
  }

  const time = d.match(/(\d+)(?:\s*[–-]\s*\d+)?[\s-]*(sec|min)/);
  const repsFirst = /^\d+(?!\d)(?!\s*(?:[–-]\s*\d+\s*)?(?:sec|min|×))/.test(d.trim());
  const seconds = time && !repsFirst ? Number(time[1]) * (time[2] === 'min' ? 60 : 1) : undefined;

  const sets = Number(d.match(/(?:sec|min)\w*\s*×\s*(\d+)/)?.[1] ?? d.match(/^(\d+)\s*×/)?.[1] ?? 1);
  const sides = /each (side|leg|arm)|per side/.test(d) ? ['Left', 'Right'] : /each direction/.test(d) ? ['One way', 'Other way'] : [''];

  const steps: TimerStep[] = [];
  for (let set = 1; set <= (seconds ? sets : 1); set++) {
    for (const side of seconds ? sides : ['']) {
      const count = seconds && sets > 1 ? `${set} of ${sets}` : '';
      // Between rounds of the same exercise, rest no longer than one hold (8 × 5-sec holds).
      const rest = steps.length && seconds ? seconds : undefined;
      steps.push({ exercise: x, label: [side, count].filter(Boolean).join(' · ') || undefined, seconds, rest, last: false });
    }
  }
  steps[steps.length - 1].last = true;
  return steps;
}

export const hasTimer = (x: LibraryExercise) => timerSteps(x)[0].seconds !== undefined;

// Sounds: short Web Audio beeps, so no sound files are needed and it works offline.
let audio: AudioContext | undefined;

/** Call from a tap (browsers only allow sound after the user has touched the page). */
export function unlockSound() {
  audio ??= new AudioContext();
  if (audio.state === 'suspended') void audio.resume();
}

export function beep(kind: 'tick' | 'go' | 'rest' | 'done') {
  if (!audio) return;
  const tones: Record<typeof kind, [freq: number, ms: number][]> = {
    tick: [[880, 120]],
    go: [[1320, 450]],
    rest: [[660, 250], [520, 350]],
    done: [[880, 180], [1100, 180], [1320, 450]],
  };
  let at = audio.currentTime;
  for (const [freq, ms] of tones[kind]) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.5, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + ms / 1000);
    osc.connect(gain).connect(audio.destination);
    osc.start(at);
    osc.stop(at + ms / 1000 + 0.05);
    at += ms / 1000 + 0.05;
  }
  navigator.vibrate?.(kind === 'tick' ? 80 : 300);
}

export function say(text: string) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB';
  speechSynthesis.speak(u);
}

export const stepName = (s: TimerStep) => (s.label ? `${s.exercise.name}, ${s.label}` : s.exercise.name);

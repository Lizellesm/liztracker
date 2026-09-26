import type { ExerciseCategory, LibraryExercise, Routine } from './db';
import { startOfWeek } from './time';

// Starting library, from Vonda Wright's F.A.C.E. book. "book" amounts are from the book;
// "plan" amounts are a practical starting point where the book gave no number.
const STATIC_STRETCH = 'Static stretch: best after exercise or in the evening';

const stretch = (id: string, name: string): LibraryExercise => ({
  id: `f-${id}`,
  category: 'stretching',
  name,
  dose: 'At least 30 sec × 4',
  source: 'book',
  note: STATIC_STRETCH,
});

type Extra = Pick<LibraryExercise, 'equipment' | 'level' | 'note'>;

type Row = [id: string, name: string, dose: string, source?: LibraryExercise['source'], extra?: Extra];

/** One sub-group of a category's exercises, e.g. Carry a load → Core and lower back. */
const grouped = (category: ExerciseCategory, group: string, rows: Row[]): LibraryExercise[] =>
  rows.map(([id, name, dose, source, extra]) => ({ id, category, group, name, dose, source, ...extra }));
const carry = (group: string, rows: Row[]) => grouped('strength', group, rows);

// Back & posture: Perfect Posture exercises, 1 min each.
const posture = (group: string, rows: [id: string, name: string, sides?: boolean][]) =>
  grouped(
    'back',
    group,
    rows.map(([id, name, sides]) => [`b-${id}`, name, sides ? '1 min each side' : '1 min']),
  );

export const DEFAULT_LIBRARY: LibraryExercise[] = [
  { id: 'f-warmup', category: 'stretching', name: 'Easy walk or jog warm-up', dose: '5–10 min', source: 'book', note: 'Before a morning workout' },
  { id: 'f-hip-circles', category: 'stretching', name: 'Hip circles', dose: '30 sec each direction', source: 'plan', note: 'Dynamic warm-up' },
  { id: 'f-lunges', category: 'stretching', name: 'Gentle walking lunges', dose: '6 each leg', source: 'plan', note: 'Dynamic warm-up; optional' },
  { id: 'f-toe-heel', category: 'stretching', name: 'Toe and heel movements', dose: '10 each', source: 'plan', note: 'Dynamic warm-up' },
  {
    id: 'f-roll-legs',
    category: 'stretching',
    name: 'Foam roll: quads, hamstrings, glutes, calves',
    dose: '30–60 sec per area',
    source: 'plan',
    note: "Choose areas; don't try to fit all into every morning",
  },
  {
    id: 'f-roll-outer-thigh',
    category: 'stretching',
    name: 'Foam roll: outer thigh',
    dose: '30–60 sec per side',
    source: 'plan',
    note: 'Roll the muscle around it gently; don’t press hard on the side of the knee',
  },
  stretch('neck', 'Neck stretch'),
  stretch('upper-back', 'Upper back stretch'),
  stretch('chest', 'Chest stretch'),
  stretch('shoulder', 'Shoulder stretch'),
  stretch('triceps', 'Triceps stretch'),
  stretch('lower-back', 'Lower back stretch'),
  stretch('hip-flexor', 'Hip flexor stretch'),
  stretch('hamstring', 'Hamstring stretch'),
  stretch('quad', 'Quad stretch'),
  stretch('calf', 'Calf stretch'),

  // A · Aerobic
  { id: 'a-easy-walk', category: 'cardio', name: 'Easy treadmill or outdoor walk', dose: '20–30 min', note: 'Comfortable pace' },
  { id: 'a-brisk-walk', category: 'cardio', name: 'Brisk walk', dose: '30 min', source: 'book', note: 'The book’s sample aerobic session' },
  {
    id: 'a-walk-run-intervals',
    category: 'cardio',
    name: 'Treadmill walk/run intervals',
    dose: '30 min: 2 min jog + 3 min walk × 6',
    source: 'plan',
    note: 'Walking intervals are fine',
  },
  {
    id: 'a-incline-intervals',
    category: 'cardio',
    name: 'Treadmill incline intervals',
    dose: '30 min: 3 min modest incline + 2 min flat × 5',
    source: 'plan',
    note: 'With easy walking around it',
  },
  { id: 'a-steady', category: 'cardio', name: 'Steady walk/run', dose: '30 min', note: 'Sustainable pace' },
  { id: 'a-long-walk', category: 'cardio', name: 'Longer outdoor walk', dose: '40–60 min, flexible', source: 'plan', note: 'Weekend option; hills if you enjoy them' },
  { id: 'a-recovery-walk', category: 'cardio', name: 'Easy recovery walk', dose: '10–15 min', note: 'Evening option' },

  // C · Carry a load
  ...carry('Shoulders and arms', [
    ['c-band-external', 'Band external shoulder rotation', '10 each arm', 'book', { equipment: 'Band' }],
    ['c-band-internal', 'Band internal shoulder rotation', '10 each arm', 'book', { equipment: 'Band' }],
    [
      'c-shoulder-raises',
      'Shoulder raises: sideways, forwards and across body',
      '8–10 of each movement',
      'plan',
      { equipment: 'Dumbbells', note: 'Exact book instructions still need checking' },
    ],
    [
      'c-kb-shrug',
      'Kettlebell “shrug” (squat-and-swing)',
      '10 each arm',
      'book',
      { equipment: 'Kettlebell 3 kg', level: 'later', note: 'Keep out of the starter workout until the movement is reviewed' },
    ],
    ['c-biceps-curl', 'Biceps curl', '10 each arm', 'book', { equipment: 'Dumbbells' }],
    ['c-triceps-ext', 'Triceps extension', '10 each arm, 3-sec hold', 'book', { equipment: 'Dumbbells' }],
    ['c-floor-press', 'Dumbbell floor press', '8–10 each arm', 'plan', { equipment: 'Dumbbells' }],
    ['c-row', 'One-arm dumbbell row', '8–10 each arm', 'plan', { equipment: 'Dumbbells' }],
  ]),
  ...carry('Core and lower back', [
    ['c-dead-bug', 'Dead bug (“Dying Bug”)', '10 each side, 3-sec hold', 'book', { note: 'Also in Perfect Posture' }],
    ['c-plank', 'Forearm plank', '15–25 sec to start', 'plan', { note: 'Also in Perfect Posture' }],
    ['c-side-plank', 'Side plank', '30 sec each side, or shorter holds', 'book', { note: 'Also in Perfect Posture' }],
    ['c-side-plank-swing', 'Side plank with upper-leg swing', '10 swings each side', 'book', { level: 'later' }],
    [
      'c-side-plank-lift',
      'Side plank with upper-leg lift',
      'Up to 45 sec per lift, 10 each side',
      'book',
      { level: 'later', note: 'Advanced; not a starting target' },
    ],
    ['c-superman', 'Superman', '10, hold 5 sec', 'book'],
    ['c-crunch', 'Classic crunch', '10', 'book', { level: 'optional' }],
    ['c-russian-twist', 'Russian twist', '10 right-and-left cycles', 'book', { level: 'optional', note: 'Review comfort and form' }],
    ['c-oblique-twist', 'Lying oblique twist', '10 cycles', 'book', { level: 'optional', note: 'Use a comfortable range' }],
    ['c-mountain-climber', 'Mountain climber', '10 alternating cycles', 'book', { level: 'later' }],
    ['c-kb-twist', 'Kettlebell twist', '10 each side', 'book', { level: 'optional', equipment: 'Kettlebell 3 kg' }],
  ]),
  ...carry('Glutes, quads and knees', [
    ['c-wall-squat', 'Short arc wall squat', '10, hold 10 sec', 'book', { equipment: 'Wall' }],
    ['c-straight-leg-raise', 'Straight leg raise', '10 each leg, hold 5 sec', 'book'],
    ['c-abduction', 'Side-lying leg abduction', '10 each side, hold 3 sec', 'book'],
    ['c-adduction', 'Side-lying leg adduction', '10 each side, hold 3 sec', 'book'],
    ['c-prisoner-squat', 'Prisoner squat', '10', 'book', { level: 'later', note: 'Progression from the wall squat' }],
    ['c-monster-walk', 'Monster walk', '10 small steps each direction, or 45 sec', 'book', { equipment: 'Loop band' }],
    ['c-fire-hydrant', 'Fire hydrant', '10 each leg', 'book'],
    ['c-runners-lunge', 'Runner’s lunge', '10 each leg', 'book'],
    ['c-split-squat', 'Reverse split squat', '10 each leg, brief lowered hold', 'book'],
    ['c-chair-squat', 'Chair squat', '8–10', 'plan', { equipment: 'Chair', note: 'Starting alternative' }],
    ['c-glute-bridge', 'Glute bridge', '10–12', 'plan'],
    ['c-step-up', 'Supported step-up', '8 each leg', 'plan', { equipment: 'Step' }],
  ]),
  ...carry('Lower legs and ankles', [
    ['c-plantar', 'Band plantar flexion: point foot away', '8 × 5-sec holds', 'plan', { equipment: 'Long band', note: 'Book: 5-sec holds until the calf tires' }],
    [
      'c-dorsi',
      'Band dorsiflexion: pull foot towards you',
      '8 × 5-sec holds',
      'plan',
      { equipment: 'Long band + anchor', note: 'Book: 5-sec holds until the shin muscle tires' },
    ],
    ['c-inversion', 'Band ankle inversion: turn foot inward', '8 × 5-sec holds', 'plan', { equipment: 'Band + anchor', note: 'Book: 5-sec holds until tired' }],
    ['c-eversion', 'Band ankle eversion: turn foot outward', '8 × 5-sec holds', 'plan', { equipment: 'Band + anchor', note: 'Book: 5-sec holds until tired' }],
    ['c-shin-raise', 'Wall shin raise', '10', 'book', { equipment: 'Wall' }],
    ['c-single-shin-raise', 'Single-leg wall shin raise', '', undefined, { equipment: 'Wall', level: 'later', note: 'Exact count not shown in the book' }],
    ['c-heel-step-down', 'Heel step-down', '', undefined, { equipment: 'Step', note: 'Instructions and count not captured yet' }],
  ]),

  // E · Equilibrium
  {
    id: 'e-stork',
    category: 'balance',
    name: 'Stork: stand on one leg',
    dose: '30 sec × 2 each leg',
    source: 'book',
    equipment: 'Counter',
    note: 'Fingertip on the counter if needed',
  },
  { id: 'e-toe-raise', category: 'balance', name: 'Toe raise / balance on toes', dose: '10', source: 'book', equipment: 'Chair nearby' },
  { id: 'e-marching', category: 'balance', name: 'Standing hip flexor / marching raise', dose: '10–15 each leg', source: 'book', equipment: 'Chair if needed' },
  { id: 'e-side-raise', category: 'balance', name: 'Standing side leg raise', dose: '10–15 each leg', source: 'book', equipment: 'Chair if needed' },
  {
    id: 'e-walk-line',
    category: 'balance',
    name: 'Walk the line, heel-to-toe',
    dose: '5–10 forward steps beside support',
    source: 'plan',
    note: 'Book: walk forward and back; no step count given',
  },

  ...posture('Standing', [
    ['mountain', 'Mountain pose'],
    ['windmill', 'Standing windmill'],
    ['side-bends', 'Standing side bends'],
    ['standing-cat-cow', 'Standing cat-cow'],
    ['forward-fold', 'Forward fold'],
    ['pyramid', 'Pyramid pose', true],
    ['warrior-2', 'Warrior 2', true],
    ['wall-slides', 'Wall slides'],
  ]),
  ...posture('On all fours', [
    ['cat-cow', 'Cat-cow'],
    ['cat', 'Cat pose'],
    ['bird-dog', 'Bird-dog', true],
    ['child', 'Child’s pose'],
    ['puppy', 'Extended puppy'],
    ['dolphin', 'Dolphin pose'],
  ]),
  ...posture('Planks', [
    ['high-plank', 'High plank'],
    ['forearm-plank', 'Forearm plank'],
    ['side-plank', 'Side plank', true],
    ['reverse-plank', 'Reverse plank'],
  ]),
  ...posture('Seated', [
    ['staff', 'Staff pose'],
    ['seated-forward-bend', 'Seated forward bend'],
    ['head-to-knee', 'Head to knee', true],
  ]),
  ...posture('Lying', [
    ['bridge', 'Bridge pose'],
    ['hip-raise', 'Hip raise'],
    ['dead-bug', 'Dead bug'],
    ['sphinx', 'Sphinx pose'],
    ['toe-tap', 'Supine toe tap'],
    ['open-book', 'Open book', true],
  ]),
];

export const DEFAULT_ROUTINES: Routine[] = [
  {
    id: 'back-perfect-posture',
    category: 'back',
    name: 'Perfect Posture',
    exercises: ['b-open-book', 'b-bridge', 'b-cat-cow', 'b-dead-bug'],
    dailyTotal: 13,
    note: '1 min each, 10 sec rest · about 15 min',
  },
  {
    id: 'f-morning-warmup',
    category: 'stretching',
    name: 'Morning warm-up',
    exercises: ['f-warmup', 'f-hip-circles', 'f-lunges', 'f-toe-heel'],
  },
  {
    id: 'f-15-minutes',
    category: 'stretching',
    name: '15-minute selection',
    exercises: ['f-hip-circles', 'f-toe-heel', 'f-roll-legs', 'f-hip-flexor', 'f-hamstring', 'f-chest', 'f-upper-back'],
    note: 'About 15 minutes',
  },
  {
    id: 'f-full',
    category: 'stretching',
    name: 'Full flexibility routine',
    exercises: DEFAULT_LIBRARY.filter((x) => x.category === 'stretching').map((x) => x.id),
    note: 'Takes much longer than 15 minutes',
  },
];

/**
 * The exercises of a routine on a given day, in library order (so a session flows
 * standing → floor). Daily routines add a rotating pick: the other exercises are
 * shuffled once per week and dealt out in turn, so all of them come up within 3 days.
 */
export function routineExercises(r: Routine, library: LibraryExercise[], day: number): LibraryExercise[] {
  const mine = library.filter((x) => x.category === r.category);
  const ids = new Set(r.exercises);
  if (r.dailyTotal) {
    const pool = mine.filter((x) => !ids.has(x.id) && x.level !== 'later');
    const week = startOfWeek(day);
    const dayOfWeek = Math.round((day - week) / 86_400_000);
    const shuffled = shuffle(pool, week);
    const count = Math.min(Math.max(0, r.dailyTotal - ids.size), shuffled.length);
    for (let i = 0; i < count; i++) ids.add(shuffled[(dayOfWeek * count + i) % shuffled.length].id);
  }
  return mine.filter((x) => ids.has(x.id));
}

/** Same order for the same seed (a small seeded PRNG, mulberry32). */
function shuffle<T>(items: T[], seed: number): T[] {
  let a = Math.floor(seed / 1000) >>> 0;
  const random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

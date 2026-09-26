# LizTracker – Plan & status

Personal gut health, food and exercise tracker, modelled on "Bowel: Gut health tracker" (Play Store).
It's a PWA installed on an Android phone. It runs offline, and all data stays on the phone.

**Live:** https://lizellesm.github.io/liztracker/ (pushing to `main` deploys automatically)

## Done

- **Home:** Water card, Quick log tiles (Food → meals screen, Exercise, Bowel), and a "Fill in today's entry" button
- **Today's log page** (one scrolling page with Done): water; Today's meals (quick add by meal, 👍 safe / 👎 trigger, edit, delete, Safe/Triggers totals); exercise; bowel movements; cramps; bloating; supplements (every day / workdays / picked weekdays / as needed; the time each was ticked is kept); "More about your day" (well-being, feeling, stress, sleep, weight); notes
- **Bowel form:** Bristol tiles like the original app, no blood question, optional "More details"
- **Exercise:** F.A.C.E. categories (Vonda Wright): Flexibility / Aerobic / Carrying load / Equilibrium, plus Back & posture (scoliosis, Perfect Posture). Combinable, minutes per category. Aerobic also has distance (km, shows speed and pace) and the treadmill's built-in program P1–P24, with a "Last time: P7" reminder
- **Weekly exercise plan** (`settings.weekPlan`, default in `src/exerciseLibrary.ts`): focus per weekday (category, optional library sub-groups, note), edited in Settings. Shown as "Today's plan" on Today's log and in the exercise form (tap to pick; done once any entry that day covers it, so morning + afternoon both count); planned sub-groups open with a "Planned" tag; History's exercise calendar shows planned days as rings
- **Exercise timer** (`src/timer.ts`, `ExerciseTimer.tsx`): full-screen countdown for today's Perfect Posture list ("Start timer") or any timed exercise (▶ on its row). Time read from the amount text (sides, × sets, jog/walk intervals; rep-based ones get a "Done" button). Beeps (Web Audio) on the last 3 s and each change, optional spoken "Next: …", vibration, screen kept on (Wake Lock). Finished exercises get ticked. Rest time and speech in Settings → Exercise timer
- **Exercise library:** per-category exercises with amount (Book/Plan) and note, ticked off in the exercise form; routines ("15-minute selection", "Full flexibility routine", …) tick a set in one tap, and ticked exercises can be saved as a new routine. Daily Perfect Posture routine: 13 a day, Open book / Bridge / Cat-cow / Dead bug every day, the other Back & posture exercises rotate (weekly shuffle, all come up within 3 days; `routineExercises` in `src/exerciseLibrary.ts`). Edited in Settings → Exercise library. Seeded from the user's F.A.C.E. summary (C split into body-area groups; tags for equipment and Optional/Later). New starting exercises added in code reach existing libraries (`settings.seeded`)
- **History:** weekly "Habit calendar" with Good/Fair/Bad/No data dots; "Exercise calendar" below it (F/A/C/E/Back rows, coloured dot per day done, week totals against the goals); day summary, and Edit to open that day's log page
- **Settings:** Backup (share as .txt / save / restore), light/dark/phone theme, water goal, weekly exercise goals
- Soft & calm design (lavender, pastel icon bubbles, Nunito font, floating tab bar), copied from screenshots of the original app

## Stats (built)

`src/screens/Stats.tsx` (lazy-loaded, it carries Recharts) with the calculations in `src/stats.ts`. Week / Month / 3 months; days before the first logged day are ignored.

- **Regularity:** days since the last movement (green / amber / red against Settings → Regularity), days with a movement, average days between, longest gap, a Monday-aligned day strip coloured by stool type (tap a day for details)
- **Stool types:** Bristol distribution, % ideal vs hard
- **What helps you go:** water, exercise and high-fibre food on the day before a movement vs the day before none (needs 3+ of each); for as-needed supplements marked "for constipation", how soon a movement followed
- **Supplements:** taken vs due per supplement, count for as-needed ones
- **Exercise:** this week's rings, back & posture streak, days per category
- **Water, Food (top safe / trigger), Weight** (line chart, 2+ entries)

Ideas: week-by-week exercise history; mood, stress and sleep trends.

## Next: exercise

- Record actual reps/time per exercise (the library amount is only a starting target)
- Starter routines for C and E
- Maybe later: take aerobic activity and duration from Garmin
- Show a routine's name in the day summary instead of listing all its exercises

## Later / ideas

- Doctor report (CSV or printable PDF for a date range)
- Reminders aren't possible reliably in a PWA; medication times are display-only

## User preferences

- Home stays minimal: only the water card, quick-log tiles and the log button
- Order everywhere: Water → Food → Exercise → Bowel (bowel isn't the main focus)
- Matches the original app's look when a screenshot is given

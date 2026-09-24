# LizTracker – Plan & status

Personal gut health, food and exercise tracker, modelled on "Bowel: Gut health tracker" (Play Store).
It's a PWA installed on an Android phone. It runs offline, and all data stays on the phone.

**Live:** https://lizellesm.github.io/liztracker/ (pushing to `main` deploys automatically)

## Done

- **Home:** Water card, Quick log tiles (Food → meals screen, Exercise, Bowel), and a "Fill in today's entry" button
- **Today's log page** (one scrolling page with Done): water; Today's meals (quick add by meal, 👍 safe / 👎 trigger, edit, delete, Safe/Triggers totals); exercise; bowel movements; cramps; bloating; daily medication (defined once, ticked per day); "More about your day" (well-being, feeling, stress, sleep, weight); notes
- **Bowel form:** Bristol tiles like the original app, no blood question, optional "More details"
- **Exercise:** categories Back (scoliosis) / Strength (bone health) / Cardio / Stretching, combinable, minutes per category, back-exercise checklist
- **History:** weekly "Habit calendar" with Good/Fair/Bad/No data dots, day summary, and Edit to open that day's log page
- **Settings:** Backup (share as .txt / save / restore), light/dark/phone theme, water goal, weekly exercise goals
- Soft & calm design (lavender, pastel icon bubbles, Nunito font, floating tab bar), copied from screenshots of the original app

## Next: Stats

Switchable Week / Month / 3 months:

- **Gut:** movements per day, Bristol type distribution, cramps and bloating trend
- **Food insights ⭐:** top triggers and top safe foods; foods and tags eaten 6–48 h before bloating/cramps days or type 6–7 movements
- **Exercise:** weekly rings against goals (`src/components/WeekCard.tsx` already exists, currently unused), week-by-week history, back-exercise streak
- **Water:** average glasses, days the goal was hit
- **Well-being:** mood, stress and sleep trends, weight line chart (Recharts is installed)
- **Medication:** adherence per medication

## Later / ideas

- Doctor report (CSV or printable PDF for a date range)
- Reminders aren't possible reliably in a PWA; medication times are display-only

## User preferences

- Home stays minimal: only the water card, quick-log tiles and the log button
- Order everywhere: Water → Food → Exercise → Bowel (bowel isn't the main focus)
- Matches the original app's look when a screenshot is given

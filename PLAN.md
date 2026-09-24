# LizTracker – Plan

Personal gut health tracker, inspired by "Bowel: Gut health tracker" (Play Store), with food and exercise tracking added.
It's a PWA installed on an Android phone. It runs offline and keeps all data on the device.

## Tech stack

- **React + TypeScript + Vite**: the app itself
- **vite-plugin-pwa**: makes it installable and lets it work offline
- **Dexie (IndexedDB)**: local database on the phone
- **Recharts**: stats charts
- **GitHub Pages**: free hosting, updated automatically on each push

## Data model

**BowelEntry**
- `id`, `timestamp`
- `bristolType` (1–7), `color`, `amount` (small/medium/large)
- `urgency` (0–3), `pain` (0–10), `straining`, `incomplete`, `blood`, `mucus` (booleans)
- `notes`

**FoodEntry**
- `id`, `timestamp`, `meal` (breakfast/lunch/dinner/snack/drink)
- `description` (free text), `tags` (e.g. dairy, gluten, spicy, fried, caffeine, alcohol, high-fibre, sugar; you can add your own)
- `portion` (small/medium/large), `waterMl` (optional), `notes`

**ExerciseEntry** (one session; can combine several categories)
- `id`, `timestamp`
- `categories`: multi-select from
  - 🧍 **Back** (scoliosis / physio exercises)
  - 🏋️ **Strength** (bone density)
  - ❤️ **Cardio**
  - 🧘 **Stretching**
- `minutes` per selected category (optional; e.g. Back 15 + Stretching 10)
- `activity` (optional free text: walk, gym, Pilates…)
- `backExercisesDone` (optional checklist from your own list of back exercises)
- `intensity` (light/moderate/hard), `notes`

**WeeklyGoals** (set in Settings, editable)
- sessions or minutes per week for each category, e.g. Back 5×, Strength 2–3×, Cardio 150 min, Stretching 5×

**Settings**
- custom food tags, custom exercise types, theme (light/dark)

## Screens

1. **Today**: three big quick-add buttons (💩 Bowel / 🍽 Food / 🏃 Exercise) and a timeline of today's entries
2. **Log forms**: one per entry type, quick to fill in. Time defaults to now; all fields except the essentials are optional
3. **History**: a calendar with icons on each day; tap a day to see, edit or delete its entries
4. **Stats**
   - bowel movements per day, Bristol type trend, days since the last movement
   - **Exercise this week:** progress rings for Back / Strength / Cardio / Stretching against weekly goals
   - week-by-week history per category, and the streak for back exercises
   - **Food → gut insights:** for each food tag, the average Bristol type and symptoms in the 6–48 h after eating it
   - **Exercise → gut:** regularity on active days vs rest days
5. **Settings**: export/import (JSON backup, CSV for the doctor), manage food tags, back exercise list, weekly exercise goals, dark mode

## Build order

1. Project setup, PWA install, deploy to GitHub Pages, install on the phone
2. Database + Bowel log + Today screen
3. Food log + Exercise log
4. History / calendar with edit and delete
5. Export / import backup
6. Stats + food/exercise insights
7. Polish: dark mode, custom tags, icons

Steps 1–2 give a working app on the phone early; each later step adds to it.

## Notes

- All data stays on the phone. **Export a backup regularly**: clearing Chrome's site data would delete it.
- Reminders are out of scope for now (a PWA limitation). We can add them later if needed.

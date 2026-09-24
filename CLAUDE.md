# LizTracker

Personal PWA for one user (Android phone). See PLAN.md for status, next steps and the user's UI preferences.

## Stack

React 19 + TypeScript + Vite, `vite-plugin-pwa`, Dexie (IndexedDB), lucide-react icons, Nunito via @fontsource. There's no backend: all data is on the device.

- `npm run dev`: dev server (`--host`, so a phone on the same Wi-Fi can open it)
- `npm run build`: type-check and build. Run this after every change.
- Deploy: push to `main`. GitHub Actions builds with `BASE_PATH=/<repo>/` and publishes to Pages.

## Code map

- `src/db.ts`: schema (`bowel`, `food`, `exercise`, `days` keyed by local-midnight `day`, `settings`). **Add a new Dexie version** for index changes; optional fields need no migration.
- `src/backup.ts`: export/restore of all tables. New tables must be added to `TABLES`.
- `src/history.ts`: loads a range of days and holds the Good/Fair/Bad rating rules.
- `src/forms/*`: log forms. `FormShell` renders them as a bottom sheet or inline (`inline` prop).
- `src/components/DayLogSheet.tsx`: the one-page "Today's log".
- `src/styles.css`: all styles. Colours are CSS variables (tones `--x-bg`/`--x-fg`), and dark mode is defined twice (media query and `[data-theme='dark']`).

## Gotchas

- Android Chrome refuses to share `.json` files ("Permission denied"), so shared backups are `.txt`.
- Lucide in this version names faces `FaceSlightlySmiling`, etc. (no `Smile`/`Frown`). Check names in `node_modules/lucide-react/dist/lucide-react.d.ts`.
- To test with realistic data, restore a hand-made backup JSON via Settings → Restore.
- Commits use the GitHub no-reply email for the personal account `Lizellesm` (set in the repo's local git config). Never use the work email in this public repo.

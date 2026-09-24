# LizTracker

Personal gut health, food and exercise tracker. It installs on your phone as a web app (PWA) and works offline.

**Live app:** https://lizellesm.github.io/liztracker/
On Android: open the link in Chrome, then tap **â‹® â†’ Add to Home screen â†’ Install**.

All data is stored on the phone (IndexedDB), never in this repo or on a server.

## Development

```sh
npm install
npm run dev      # local dev server (also reachable from your phone on the same Wi-Fi)
npm run build    # production build into dist/
```

Pushing to `main` deploys to GitHub Pages automatically (`.github/workflows/deploy.yml`).

See [PLAN.md](PLAN.md) for the roadmap.

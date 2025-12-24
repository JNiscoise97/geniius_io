# Echo Desktop (Tauri) — Placeholder

This folder is a placeholder. After verifying the PWA works, initialize Tauri:

```bash
pnpm dlx tauri@latest init
# Choose: existing front-end (dist), dev command: pnpm --filter @echo/web dev, dist dir: apps/web/dist
pnpm --filter @echo/desktop dev
```

Then implement a SQLite-native adapter and expose it via Tauri bridge.

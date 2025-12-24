# Echo — Starter Monorepo

**Offline‑first core shared across Web (PWA), Desktop (Tauri) and Mobile (Capacitor).**  
This starter runs fully with an **in‑memory Storage** so you can dev instantly, and has clean interfaces to swap to SQLite later.

## Structure
```
apps/
  web/        # Vite + React PWA
  desktop/    # Tauri shell (placeholder)
  mobile/     # Capacitor shell (placeholder)
packages/
  domain/     # types & business rules
  data/       # Storage/Files/SyncClient interfaces + MemoryStorage
  platform/   # platform adapters (web/tauri/capacitor) — thin
  ui/         # React pages & components (shared)
```

## Quickstart
```bash
pnpm i
pnpm dev:web
```

You’ll get a minimal Contacts app (list + add + delete) using **@echo/data MemoryStorage**.  
Later replace it with SQLite adapters:

- Web: SQLite WASM (sql.js / wa-sqlite)
- Desktop: Tauri + sqlite-native
- Mobile: Capacitor SQLite

## Scripts
- `pnpm dev:web` — run the PWA
- `pnpm build:web` — build the PWA
- `pnpm preview:web` — preview the build
- `pnpm dev:desktop` — placeholder command for Tauri (see apps/desktop/README.md)
- `pnpm dev:mobile` — placeholder for Capacitor (see apps/mobile/README.md)

---

Generated on 2025-09-16.

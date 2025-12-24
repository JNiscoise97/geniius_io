# Echo Mobile (Capacitor) — Placeholder

Once PWA is working, scaffold Capacitor:

```bash
pnpm dlx @capacitor/cli init echo io.echo.app --web-dir=apps/web/dist
pnpm --filter @echo/web build
npx cap add android
npx cap add ios
npx cap open android # or ios
```

Implement a Capacitor SQLite adapter and use it by passing the storage to <App /> at bootstrap.

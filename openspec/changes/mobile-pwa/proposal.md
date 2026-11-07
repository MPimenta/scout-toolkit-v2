## Why

Leaders use the Kit on their phones, often outdoors where signal is poor and a browser tab is easy to lose. Today the app is a plain responsive website: there is no web app manifest, no service worker, no install path and no offline behaviour (checked in `src/app/layout.tsx`, `next.config.mjs`, `public/` and `src/middleware.ts`; the only related assets are `icon.png` and `apple-icon.png`, both 562×560). Making it an installable Progressive Web App gives leaders a home-screen icon, a full-screen app-like window, faster repeat loads and a clear "no connection" screen instead of the browser's error page, without building and publishing a native app.

This is a phone-first change. Desktop browsers get installability for free but are not a target.

## What Changes

- **Web app manifest**: name, short name, `id`, `start_url`, `scope`, `display: standalone`, `lang: pt`, theme and background colours that mirror the existing tokens, and icons (192, 512 and a maskable 512) made from the existing AEP mark. Shortcuts to "Atividades" and "Programas" reuse existing navigation labels.
- **Head metadata**: `viewport-fit=cover`, `theme-color` for light and dark, Apple web-app meta and touch icon, so iOS Safari and Android Chrome treat the site as an app.
- **Service worker (hand-written, no build plugin)**: caches the immutable `/_next/static/` assets and brand images, serves a Portuguese offline page when a navigation fails, and never caches API responses, authenticated pages, auth routes, exports or uploads. A versioned cache and an update prompt ("nova versão disponível") keep it from serving stale code.
- **Install experience**: an "Instalar aplicação" entry in the phone menu and on the About page. On Android/Chrome it uses the browser install prompt; on iOS (which has none) it shows short "Partilhar → Adicionar ao ecrã principal" steps. It never appears when the app is already installed and never nags.
- **Standalone-mode polish**: respect device safe areas (notch, home indicator), provide an in-app back control where the browser's back button is missing, keep external links (Orgo/eAEP, GitHub) opening in the browser, and make sure the Excel and PDF exports still download.
- **Safety and rollout**: everything sits behind a new `pwa` feature flag, with a kill switch (a self-unregistering worker) and cache clearing on sign-out. CSP, headers and the `FEATURE_ROUTES` coverage are updated for the new routes.
- **Tests**: unit tests for the manifest and token colours, Playwright checks on a production build for installability, service worker registration, offline fallback and "nothing private is cached".

**Not in this change** (kept as follow-ups in `design.md`):
- Offline reading of activities and the user's programs, and any offline writes or sync queue.
- Push notifications (the app has nothing to notify about yet).
- Background sync, share targets, app-store packaging (TWA, Capacitor).
- Desktop install polish.

## Capabilities

### New Capabilities
- `progressive-web-app`: manifest, icons, service worker rules, install experience, offline fallback, update and kill-switch behaviour, and the checks that enforce them.

### Modified Capabilities
- `mobile-layout`: standalone-window behaviour on a phone (safe areas, in-app back, external links, downloads).

## Impact

- **Code**: `src/app/manifest.ts` (new), `src/app/layout.tsx` (viewport and metadata), `public/sw.js` and `public/offline` assets (new), a small client component to register the worker and offer install, `src/app/offline/page.tsx` (new, always available), `src/components/layout/` (menu entry, back control, safe-area padding), `src/lib/features.ts` (new `pwa` flag), `src/middleware.ts` and `FEATURE_ROUTES` (manifest and offline classification), `next.config.mjs` (headers for `/sw.js` and `/manifest.webmanifest`), `src/messages/pt.json` and `en.json`.
- **Assets**: new PNG icons in `public/brand/pwa/` generated from the existing mark (raster only, no new colours).
- **Dependencies**: none required. A library (Serwist) was considered and rejected because the production build runs on Turbopack and the caching rules here are small.
- **Hosting**: Azure App Service must serve `/sw.js` with `Cache-Control: no-cache` and HTTPS only; Vercel previews are unaffected because the flag is off by default.
- **Other changes**: `security-testing` (CSP `worker-src`, `manifest-src`), `ux-ui-review-fixes` (touch targets and safe areas on the same controls), `activity-illustration-agent` and `enable-activity-image-uploads` (images served from `/media` must not be cached by the worker without a rule), `usage-tracking` (installed launches are tagged with `?source=pwa`).
- **Data and schema**: none.

## Context

The Kit is a Next.js 15.5 App Router app built with Turbopack (`next build --turbopack`) and deployed as a standalone server to Azure App Service (`output: 'standalone'`), with Vercel previews. Observed today: no manifest, no service worker, no `theme-color`, no `viewport-fit`, no install UI. Icons are `src/app/icon.png` and `apple-icon.png` (562×560), plus `public/brand/*`. The middleware matcher passes every path except static assets and images through `featureGate`, and `tests/unit/lib/feature-routes-coverage.test.ts` fails when a page or API route is unclassified. Auth is Auth.js with an Orgo OAuth redirect (authorization code + PKCE), so sign-in leaves the origin and returns. Data is read through TanStack Query from `/api/*` and is per-user for programs.

Users: Escoteiros leaders on Android (Chrome) and iPhone (Safari). Real usage includes camps and meetings with weak signal.

## Goals / Non-Goals

**Goals:**
- Installable on Android and iOS with a proper icon, name and full-screen window.
- Faster repeat loads from cached static assets.
- A clear Portuguese offline screen instead of the browser error.
- No private data stored by the worker, ever; a safe way to update and a way to turn it off.

**Non-Goals:**
- Offline reading or editing of activities and programs (follow-up below).
- Push notifications, background sync, share targets, native store packaging.
- New colours or a visual redesign.

## Decisions

### Hand-written service worker, not a framework plugin
A worker of roughly 100 lines, served by a route handler at `/sw.js` (see the next decision). Serwist/next-pwa need a build integration, and the production build uses Turbopack, which the webpack-based plugins do not support. The cache rules here are few, so there is no precache manifest to generate: hashed `/_next/static/` files are cache-first at runtime (their URL changes when content changes), and the offline page is precached at install. Trade-off: we own the worker's correctness, so it is small, unit-testable as pure functions where possible, and covered by Playwright on a production build.

### Serve `/sw.js` from a route handler, not from `public/`
A file in `public/` is the same bytes on every request, so the `pwa` flag (an environment variable) could not change it: switching the flag off would leave every installed phone running the old worker, and the only way to retire it would be a new deploy with a different file. `src/app/sw.js/route.ts` returns the real worker when the flag is on and the self-unregistering, cache-clearing worker when it is off, so rollback is an environment change. The worker source lives in a TypeScript module as a string (no file tracing issues in the standalone build) and the handler sets `Content-Type: text/javascript`, `Cache-Control: no-cache` and `Service-Worker-Allowed: /`. `/sw.js` is classified always-on in the coverage test. Same reasoning as the manifest handler in step 1.

### Cache allowlist, not a denylist
The worker handles only: `GET` requests for `/_next/static/**` and `/brand/**` (cache-first), navigations (network-first, offline page on failure, nothing stored), and `/offline`. Everything else goes straight to the network untouched. An allowlist means a new private route cannot be cached by accident.

### Offline in v1 is a message, not data
Offline reading of the catalogue and a user's programs would be the real benefit at camp, but it needs decisions we should not guess: how stale data may be, per-user isolation on shared phones, clearing on sign-out, what editing means offline, and conflict handling. v1 ships the honest fallback; the follow-up is proposed below.

### Behind a `pwa` flag with a kill switch
Service workers outlive deployments, so a mistake is hard to retract. The flag defaults off (MVP behaviour unchanged). When off, `/sw.js` serves a tiny worker that clears caches and unregisters itself, so turning the feature off actually removes it from phones that installed it. Sign-out also clears caches (shared phones).

### Manifest from tokens
`src/app/manifest.ts` (Next generates `/manifest.webmanifest`). Manifest colours must be literals, so a unit test parses `globals.css` and asserts `theme_color` equals the primary token (`--primary`, currently #154697) and `background_color` the light background. Dark `theme-color` comes from the dark background token through the viewport export with `media` queries. `start_url` is `/home?source=pwa` so `usage-tracking` can see installed launches; `id` is fixed so a later `start_url` change does not create a second install.

### Icons from the existing mark
Generate 192, 512 and maskable 512 PNGs from the AEP mark (`public/brand/favicon.png`) with a one-off script committed under `scripts/`; the maskable one pads the mark into the 80% safe zone on a token-coloured background. The 562×560 source is below ideal for 512 maskable after padding, so the brand team may supply a vector or larger mark (open question). No new colours.

### Install UX: on request, not on arrival
Capture `beforeinstallprompt` and show "Instalar aplicação" in the phone menu and About page only. iOS has no prompt, so detect iOS Safari that is not standalone and show a short instructions dialog (uses the existing `Dialog`). No banners: a leader opening the app for the first time should see the activities, not a request. Dismissals are remembered in `localStorage` wrapped in try/catch.

### Updates are user-controlled
New worker installs, waits, and the app shows a notice with "Atualizar" (existing `sonner` toast). On accept: `skipWaiting` message, reload on `controllerchange`. No automatic reload, because the admin editor holds unsaved multi-step input.

### Standalone behaviours
- `viewport-fit=cover` with `env(safe-area-inset-*)` padding on the header and any bottom-fixed element (the `ReportLauncher` when `issue-reports` is on, toasts).
- Back control: in standalone mode there is no browser chrome, so detail pages show a back link that goes to the list preserving its query string (catalogue filters already live in the URL; to verify during implementation).
- External links open in the system browser (`target="_blank"` with `rel="noopener noreferrer"` for other origins). The Orgo sign-in is the main risk: on Android a WebAPK normally hands out-of-scope navigations to a Custom Tab and returns via the redirect URI; on iOS the standalone window stays in-app. This must be tested on real devices before enabling the flag.
- Downloads: PDF/Excel are `GET /api/programs/[id]/export/*`. They are not cached; verify on iOS standalone, where blob downloads are unreliable, and fall back to opening in the browser if needed.

### Headers and CSP
`next.config.mjs` adds `Cache-Control: no-cache` and `Service-Worker-Allowed: /` for `/sw.js`, and a sensible short cache for the manifest. The CSP from `security-testing` needs `worker-src 'self'`, `manifest-src 'self'` and no `unsafe-eval`; coordinate when that change lands. HTTPS is mandatory (service workers refuse to register otherwise, except on localhost).

### Testing
Service workers do not run under the dev server's Turbopack HMR in a useful way, so registration is enabled only when `NODE_ENV === 'production'`. A new Playwright project `pwa` builds the app (`next build`, e2e database, `FEATURES=pwa`) and runs it on its own port, then: fetches the manifest and validates fields; asks Chromium for installability errors through CDP (`Page.getInstallabilityErrors`); checks the worker controls the page; goes offline with `context.setOffline(true)` and expects the offline page; and lists every cache entry after a signed-in browse to assert no `/api/`, `/auth/` or document entries. Unit tests cover the manifest, token colours, the install-state hook and the caching predicate (`shouldCache(request)`).

## Risks / Trade-offs

- **A bad worker is sticky** → allowlist caching, flag with kill switch, versioned caches, `no-cache` on `/sw.js`, and a documented rollback (flag off).
- **Stale code after deploys** → hashed assets only, network-first navigations, update prompt.
- **Private data on shared phones** → nothing private is ever written; cache wipe on sign-out; test asserts it.
- **Orgo OAuth inside an installed app** → untested assumption; real-device test is a gating task.
- **iOS limits** (no install prompt, 7-day storage eviction for unused sites, download quirks) → instructions dialog, tolerate empty caches, check downloads.
- **Store/app review expectations** → out of scope; this is not a store package.
- **Icon quality** from a 562 px source → open question with brand.
- **Production-build e2e is slower** → one dedicated project, run in CI only for the `pwa` flag.

## Migration Plan

Ship in this order, each as its own PR, flag off until step 5:
1. Manifest, icons, head metadata and flag (no worker yet).
2. Offline page, service worker, kill switch, registration, cache clearing on sign-out, headers.
3. Install entries and update notice.
4. Standalone polish (safe areas, back control, external links, exports) and mobile-layout spec.
5. Real-device pass (Android Chrome, iOS Safari: install, sign-in via Orgo, export, offline), then enable `pwa` on a preview and later on Azure.

Rollback: turn the flag off; the self-unregistering worker removes the cache and registration on the next visit.

## Follow-ups (not in this change)

- **Offline reading**: recently viewed activities and the user's own programs, per-user cache with explicit expiry, cleared on sign-out. Needs its own proposal.
- **Offline edits and sync queue** for the program builder.
- **Push notifications** once there is something to notify about.
- **Store packaging** (TWA/Capacitor) if the association wants a Play Store or App Store listing.

## Open Questions

- Should `pwa` ship on in the MVP, or stay off until the real-device pass is done? (Plan assumes off by default and enabled per environment.)
- App name under the icon: "Kit de Atividades" is long for a home screen. Proposed `short_name`: "Kit Atividades" (needs approval; no Portuguese copy is changed without it).
- Can the brand team provide a vector or at least a 1024 px AEP mark for the icons?
- Is offline reading of programs a priority, and which data may be kept on a phone?
- Is the Orgo/eAEP OAuth client configured with a redirect that works from an installed app on both platforms? (Check with whoever administers Orgo.)

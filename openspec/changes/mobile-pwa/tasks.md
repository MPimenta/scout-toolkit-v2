## 1. Manifest, icons and head metadata

- [x] 1.1 Add the `pwa` flag to `FEATURE_FLAGS` (off in MVP) and classify the new routes in `FEATURE_ROUTES` and the coverage test — verify `feature-routes-coverage.test.ts` passes and `FEATURES=pwa` turns the flag on
- [x] 1.2 Add a script under `scripts/` that generates 192, 512 and maskable 512 PNGs into `public/brand/pwa/` from the existing mark — verify the maskable icon fits the safe zone in a circular-mask preview
- [x] 1.3 Add the manifest as a route handler `src/app/manifest.webmanifest/route.ts` over `src/lib/pwa/manifest.ts` (the `manifest.ts` file convention always injects the link tag; name, short name, id, start_url `/home?source=pwa`, scope, standalone, lang pt, token colours, icons, shortcuts) returning 404 when the flag is off — verify a unit test on the manifest fields and that `theme_color`/`background_color` match `globals.css` tokens
- [x] 1.4 Add the viewport export (`viewport-fit=cover`, light/dark `themeColor`) and Apple web-app metadata and touch icon in `layout.tsx` — verify the rendered head contains them and does not disable zoom

## 2. Service worker and offline page

- [ ] 2.1 Add `src/app/offline/page.tsx` in Portuguese with "Tentar novamente", PT/EN strings, no network dependency — verify the page passes axe and renders with the network cut (done except the axe check: no axe tooling in the repo yet; renders with the network cut, verified in Chromium)
- [x] 2.2 Write the worker source in `src/lib/pwa/sw-source.ts`, served as `/sw.js` by `src/app/sw.js/route.ts`, with the allowlist rules (cache-first `/_next/static/` and `/brand/`, network-first navigations with offline fallback, everything else untouched), versioned cache and cleanup on activate — verify unit tests of the `shouldCache` predicate for `/api/`, `/auth/`, `/media/`, exports, non-GET and document requests
- [x] 2.3 Have the same `/sw.js` handler serve a self-unregistering, cache-clearing worker when the flag is off — verify a returning client with a registered worker ends with no registration and no caches
- [ ] 2.4 Add a client component that registers the worker in production only when the flag is on, and shows the "Atualizar" notice when a worker is waiting — verify the page is not reloaded automatically and accepting the notice activates the new version (implemented and unit-tested with fakes; still to verify in a real browser with two worker versions)
- [ ] 2.5 Clear all caches on sign-out — verify a Playwright case lists zero cache entries after sign-out (implemented and unit-tested; the Playwright sign-out case belongs to the pwa project in 5.1)
- [x] 2.6 Set the headers in the route handlers (no `next.config` change needed: the `/sw.js` handler sets its own `no-cache` and `Service-Worker-Allowed`; verify them on the built server) — verify with a header test on the built server and note the CSP `worker-src`/`manifest-src` additions for `security-testing`

## 3. Install experience

- [x] 3.1 Add an install hook (captures `beforeinstallprompt`, detects standalone and iOS Safari) — verify unit tests for each state
- [x] 3.2 Add "Instalar aplicação" to the phone menu and the About page with an iOS instructions dialog, remembered dismissal and PT/EN strings (copy approved by the maintainer) — verify it is hidden in standalone mode, never opens on load, and the dialog closes with Escape (implemented and checked in Chromium with an iPhone Safari user agent; install copy approved by the maintainer)
- [x] 3.3 Tag installed launches via `?source=pwa` for `usage-tracking` — verify the parameter does not break the home redirect or caching (the launch URLs carry the tag and the pages answer 200 with it; recording is task 3.4)
- [x] 3.4 Record an `app_launch` usage event once per session for launches from the installed app or `?source=pwa`, and say so in the privacy notice — verify unit tests for the hook, an integration test that stores the event (and not for bots or with a flag off), and the privacy page text

## 4. Standalone polish

- [ ] 4.1 Apply `env(safe-area-inset-*)` padding to the header and bottom-fixed elements and add a standalone-mode style hook — verify screenshots with a simulated inset
- [ ] 4.2 Add an in-app back control on activity detail and program pages shown in standalone mode, preserving catalogue filters — verify a Playwright case in standalone emulation returns to the filtered list
- [ ] 4.3 Ensure other-origin links open in the system browser with `rel="noopener noreferrer"` — verify no same-window external links remain in `src/`
- [ ] 4.4 Check the Excel and PDF exports and the Orgo event action when run from a standalone window — verify the file downloads or opens, with a fallback to the browser if not

## 5. Tests and rollout

- [ ] 5.1 Add a Playwright `pwa` project that builds the app, runs it on its own port with `FEATURES=pwa` and the e2e database, and checks installability errors via CDP, worker control, offline fallback and cache contents after a signed-in browse — verify it passes in CI and fails if `/api/` responses are cached
- [ ] 5.2 Confirm the existing chromium, Mobile Chrome and mvp projects are unaffected — verify they still pass and the mvp project registers no worker
- [ ] 5.3 Real-device pass on Android Chrome and iOS Safari: install, launch, sign in via Orgo, browse, export, go offline, update — verify findings are logged or tasks raised before the flag is enabled anywhere
- [ ] 5.4 Update `docs/` and the README with how to enable the flag, how to roll back, and how to test the worker locally — verify the instructions work from a clean checkout
- [ ] 5.5 Confirm CSP, `azure-hosting` response headers and HTTPS requirements with `security-testing` and the Azure setup — verify `/sw.js` is served with the right headers on the Azure environment

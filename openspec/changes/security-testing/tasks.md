## 1. Threat model and baseline

- [ ] 1.1 Write `docs/security.md`: assets, trust boundaries, data flows to and from Orgo, secret inventory, empty findings register — verify it lists every secret in `.env.example` and each Orgo endpoint the code calls
- [ ] 1.2 Review `src/lib/auth/*` and `src/lib/orgo/*` against the Orgo checklist in design.md and record findings — verify each checklist item has a pass/fail line and evidence

## 2. Automated checks in CI

- [ ] 2.1 Add `.github/workflows/security.yml` with `npm audit --omit=dev`, gitleaks and Semgrep — verify a seeded fake secret and a known-bad pattern make the job fail, then remove them
- [ ] 2.2 Add `tests/security/route-matrix.test.ts` plus the matrix file, enumerating `src/app/api/**/route.ts` and page routes — verify an unlisted dummy route fails the test
- [ ] 2.3 Fill the matrix for guest/member/admin/view-as-member and fix any route that disagrees — verify the suite is green and each fix is in the register
- [ ] 2.4 Add `tests/security/secrets-in-bundle.test.ts` scanning `.next/static` and sampled API/error responses for secret values — verify with a planted value

## 3. Abuse tests

- [ ] 3.1 Build the payload corpus and replay it against all mutating and search endpoints — verify no 5xx, no unescaped stored HTML, no stack traces
- [ ] 3.2 Add IDOR tests for programs, user activities, ratings, reports — verify cross-user access gets 403/404
- [ ] 3.3 Test `callbackUrl` open redirect, forged callback without PKCE verifier, and session contents against a mocked IdP — verify each scenario in the spec
- [ ] 3.4 Test upload abuse (type, size, script-bearing SVG) against the UploadThing config — verify refusals
- [ ] 3.5 Add a guard for `sql.raw`, string-built SQL and unescaped `ilike` patterns — verify it flags a planted example

## 4. Headers, CSRF and rate limiting

- [ ] 4.1 Add security headers in `next.config.ts`/middleware, CSP first in report-only — verify the header test and a manual click-through of catalogue, builder, admin, PDF export, Swagger and uploads show no violations Note from `mobile-pwa`: the CSP must allow `worker-src 'self'` (the service worker at `/sw.js`) and `manifest-src 'self'` (`/manifest.webmanifest`), keep no `unsafe-eval`, and leave `/sw.js` served with `Cache-Control: no-cache` and `Service-Worker-Allowed: /`; the `pwa` Playwright project fails if the worker stops registering.
- [ ] 4.2 Switch CSP to enforcing and confirm cookie flags — verify header and cookie tests are green on a production build
- [ ] 4.3 Add Origin checking for mutating routes — verify a foreign-origin POST is rejected
- [ ] 4.4 Add rate limiting to sign-in start, reports, uploads and the ingest endpoint with Portuguese 429 messages in `src/lib/errors/` — verify a flood test gets 429

## 5. Dynamic scan and close-out

- [ ] 5.1 Add ZAP baseline and authenticated active scan config targeting the e2e instance, with a guard that refuses the Production host — verify a run produces a report and the guard blocks a Production URL
- [ ] 5.2 Triage scanner output, fix criticals/highs, document accepted risks — verify the register shows no open critical or high
- [ ] 5.3 Document how to run each layer locally in `docs/security.md` and `docs/testing.md`, including the path to an external pen test — verify the commands run from a clean checkout

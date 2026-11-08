## 1. Preparation

- [x] 1.1 Data-protection contact confirmed (geral@escoteiros.pt, used on the privacy page). The wording and the legal basis still need AEP confirmation before the flag is enabled in Production.
- [x] 1.2 Add the `usage-tracking` flag to `src/lib/features.ts` and `FEATURE_ROUTES` entries for `/api/usage/events` and `/api/usage/purge`; `tests/unit/lib/feature-routes-coverage.test.ts` stays green.

## 2. Data

- [x] 2.1 Add the `usage_events` table and indexes in `drizzle/schema`, export the types in `src/types/`, and generate the migration with `npm run db:generate` (ask before running); review the SQL and commit it.
- [x] 2.2 Zod schemas for the search payload and the events endpoint body (text max 200, bounded filter lists, uuid ids).

## 3. Recording

- [x] 3.1 `shouldRecord` helper (bot and headless user-agents, `Sec-GPC`, `DNT`, opt-out cookie) with unit tests.
- [x] 3.2 Visitor id helper: create, read and set the cookie (`HttpOnly`, `SameSite=Lax`, `Secure` in production, 13 months); no cookie when recording is refused.
- [x] 3.3 `POST /api/usage/events` for `search` and `activity_view`: flag, validation, rejection of `program_add`, unknown activity id, rate limit, 30-minute view de-duplication, Portuguese errors, safe when recording fails.
- [x] 3.4 Record `program_add` server-side in `POST /api/programs/[id]/entries` after a successful insert; a failure to record never fails the request.
- [x] 3.5 Link visitor to user on sign-in and on the first event after sign-in; integration test for attribution.
- [x] 3.6 Client hooks `useTrackSearch` (settled, debounced, skips empty and unchanged searches) and `useTrackActivityView`, wired into the catalogue page and `ActivityDetail`, gated by `useFeature('usage-tracking')`.

## 4. Retention

- [x] 4.1 Purge function and `GET /api/usage/purge` (bearer `CRON_SECRET`), Vercel cron entry in `vercel.json`, and a test that deletes only events older than 13 months.

## 5. Privacy

- [x] 5.1 `/privacy` page with Portuguese copy and `en.json` chrome, flag-dependent tracking section, and the opt-out control that sets `tracking_off` and clears the visitor cookie.
- [x] 5.2 The footer link works (the route exists); a test confirms `/privacy` opens without sign-in.

## 6. Verification and docs

- [x] 6.1 Unit tests (helpers, schemas, hooks), integration tests (endpoint, program_add, attribution, purge, non-admin cannot read), and one E2E: browse, search, open an activity, add to a program with the flag on, and no cookie with the flag off.
- [x] 6.2 Add the flag and endpoints to `docs/api.md` and the flag notes in `docs/deployment.md`.
- [x] 6.3 typecheck, lint, unit and integration tests, and E2E (83 passed) all pass; `openspec validate usage-tracking --strict` is valid.

## 1. API

- [x] 1.1 Add `/admin/utilizacao` and `/api/admin/usage` to `FEATURE_ROUTES` under `usage-tracking`; classify the routes in the coverage test.
- [x] 1.2 `src/lib/usage/analytics.ts`: totals, daily series (Lisbon days, zero-filled), top activities by views and by additions with conversion, top search texts, searches per division, no-result searches, top users by name; period and division filters.
- [x] 1.3 `GET /api/admin/usage/summary`: `requireAdminApi`, Zod query validation, Portuguese errors, swagger comment.

## 2. Page

- [x] 2.1 `/admin/utilizacao` page with period and division controls, totals, evolution, the two activity lists, the search lists, users, indicative-figures note, loading, error and empty states.
- [x] 2.2 Link from the admin dashboard (only when the flag is on); strings in `pt.json` and `en.json`.

## 3. Verification and docs

- [x] 3.1 Integration tests: totals, period filter, division filter, conversion, text normalisation, no-result list, filter-only searches, users by name without e-mail, 401/403/404, 400 on bad period.
- [x] 3.2 Component test for the page (states, controls) and one E2E: an administrator sees events recorded by a visitor; a member gets 403.
- [x] 3.3 Document the endpoint in `docs/api.md`.
- [x] 3.4 `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run test:e2e`, `openspec validate admin-usage-analytics --strict`.

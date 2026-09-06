## 1. Data and API

- [x] 1.1 Add `issue_reports` (Drizzle) and verify `tests/setup.ts` creates it on `scout_toolkit_test`
- [x] 1.2 Add `POST /api/reports` with kind, message, optional contact, path, locale, viewport; attach session user id; reject short messages with 400 — verify unit + SQL-integration on `scout_toolkit_test`
- [x] 1.3 Rate-limit guest POSTs (5 / 10 min / IP) and signed-in (20 / 10 min) and verify 429 on the sixth guest post
- [x] 1.4 Notify each admin via `notifications` on create and verify a row is inserted

## 2. Reporter UI

- [x] 2.1 Add `pt`/`en` catalog keys for Reportar, kinds, success, and errors — verify default Portuguese matches the spec labels
- [x] 2.2 Mount a floating Reportar control + Sheet on all pages including `/auth/signin` and verify it opens without navigation
- [x] 2.3 Submit sends automatic path, locale, and viewport and shows the success message — verify Playwright Chromium on `/activities` as a guest

## 3. Admin queue

- [x] 3.1 Add admin list/close APIs under `/api/admin/reports` and verify 401 guest / 403 user / 200 admin
- [x] 3.2 Add `/admin/reportes` (list, filter abertos, mark fechado) plus dashboard count and nav — verify Playwright as admin
- [x] 3.3 Confirm the launcher stays tappable at 390px and does not invent a new brand colour

## 1. Parse and import

- [ ] 1.1 Add a row parser (headers, enum key/label, goal codes, SDG numbers, name+age duplicate key) and verify unit tests for valid PT labels, unknown tipo, and short/empty rows
- [ ] 1.2 Add `POST /api/admin/activities/import` that creates via `createActivity`, skips repeats, continues on invalid rows — verify SQL-integration on `scout_toolkit_test` (401/403, created+skipped+invalid counts)
- [ ] 1.3 Copy `templates/atividades-import.xlsx` to `public/templates/` (or serve it) and verify the downloadable file has sheets Atividades, Valores, and Instruções

## 2. Admin UI

- [ ] 2.1 Add template download + file upload + result counts on `/admin/atividades` — verify Playwright Chromium as admin imports the example row once and skips it on a second import

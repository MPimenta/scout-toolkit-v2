## 1. Navigation and statistics shell

- [ ] 1.1 Admin menu grouped as Catálogo, Estatísticas, Comunidade, Utilizadores, with pending counts; messages in `pt.json` and `en.json` (Portuguese copy for approval)
- [ ] 1.2 Create `/admin/estatisticas` with the three views, move the usage page under it and redirect `/admin/utilizacao`; classify new routes in `FEATURE_ROUTES` and keep usage behind `usage-tracking`
- [ ] 1.3 Tests: redirect, coverage and ranking visible with tracking off, forbidden for non-admins

## 2. Coverage

- [ ] 2.1 Aggregation module in `src/lib/admin/` returning objective-division pairs with `catalogue_count` and `programs_count`, plus *desafio* coverage; roll-ups computed from the same rows
- [ ] 2.2 `GET /api/admin/coverage` (admin only; filters division, area, format, focus; Zod-validated)
- [ ] 2.3 Page: area / path / general objective tree with counts per division, gaps-only toggle, totals line, catalogue and programs lenses, *desafios* table with the integration marker
- [ ] 2.4 Excel export of the current view (SheetJS), admin only
- [ ] 2.5 Unit tests for aggregation and roll-ups; SQL-integration test on a small seeded set (unapproved excluded, shared objective gives two pairs, Dirigentes absent, programs lens counts distinct activities)

## 3. Ranking

- [ ] 3.1 Query module: distinct programs and distinct leaders per approved activity, period filter on program creation date, division, format and focus filters, top and least-used lists
- [ ] 3.2 `GET /api/admin/ranking` (admin only) returning counts and activity names only
- [ ] 3.3 Page with filters, both lists and the definition note next to the figures
- [ ] 3.4 Integration tests: one entry counted once per program, leaders distinct, private programs counted without identities, never-added activities in the least-used list

## 4. Activities at scale

- [ ] 4.1 Extend the list endpoint: pagination, search, filters (approval, format, focus, division, source, missing item), address-backed state; add indexes only if measurements on the full set need them
- [ ] 4.2 Completeness computed in the query and shown per row with a "missing" filter
- [ ] 4.3 `POST /api/admin/activities/bulk` (approve, unapprove, delete; max 200 ids; one transaction; 409 with blockers); selection UI and confirmation with the count
- [ ] 4.4 Duplicate action (unapproved copy, no external id, no program references)
- [ ] 4.5 Delete confirmation shows programs, reviews and suggestions that depend on the activity
- [ ] 4.6 Tests: filters and pagination, bulk actions and 409, duplicate, delete dependencies

## 5. Formats and focuses admin

- [ ] 5.1 Taxonomy endpoints for formats and focuses (create, rename, reorder, delete for own values; 409 for sheet values; non-admin 403) following the existing taxonomy pattern
- [ ] 5.2 "Move activities then delete" in one transaction, with the secondary-equals-main rule applied
- [ ] 5.3 Taxonomies page sections with description, source (sheet or own), usage count and the move dialog
- [ ] 5.4 Tests: read-only sheet values, delete in use, move then delete, duplicate-focus case

## 6. Verification

- [ ] 6.1 Measure the coverage and ranking queries on the full activity set; record the timings in the design
- [ ] 6.2 `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run test:e2e` (Playwright: filters, gap list, export, bulk approve)
- [ ] 6.3 Update `docs/architecture.md`, `docs/api.md` and `docs/planning.md`; `openspec validate admin-revamp --strict`

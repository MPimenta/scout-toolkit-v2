## 1. Confirm inputs

- [ ] 1.1 Compute the exact usage counts per type over the full sheet and the local database (the figures in the design are from the 97 loaded activities and a visual pass over the sheet column).
- [ ] 1.2 Two groups (Formato, Foco) decided. Wait for the product owner's review of the activity list before fixing the final type-to-group assignment, the fate of Jogo and Serviço, and the ten descriptions; the data files are written from that outcome.

## 2. Schema and migration

- [ ] 2.1 `drizzle/schema/taxonomies.ts`: add `code` (unique, nullable for admin types), `kind`, `position` and `is_managed` to `activity_types`; mirror them in `tests/setup.ts`.
- [ ] 2.2 **Ask first**, then `npm run db:generate`. Review the SQL (additive; backfill of code, group and position for the ten names, matching case and accents) and commit it with snapshot and journal.

## 3. Reference data

- [ ] 3.1 Add `drizzle/seeds/data/activity-types.json` and `src/lib/reference-data/activity-types.ts` (`applyActivityTypes`, upsert by code, write only changed rows, managed).
- [ ] 3.2 Call it from `scripts/load-reference-data.ts`, `drizzle/seeds/index.ts`, the Vercel hook (through `db:load-reference`) and the e2e global setup; remove the old type seed.
- [ ] 3.3 Integration tests: fresh load, second load changes nothing, existing rows keep their ids and links, admin types survive.

## 4. API

- [ ] 4.1 `GET /api/taxonomies/activity-types` returns the new fields and `activity_count` (approved activities, one grouped query), ordered as specified; update types, guards and swagger.
- [ ] 4.2 Admin taxonomy route: 409 on update or delete of a managed type; creation of unmanaged types; keep the in-use delete rule.
- [ ] 4.3 Tests for counts (approved only), grouping order, the 409 cases and admin-created types.

## 5. Import and cleanup

- [ ] 5.1 Baseline loader matches `Tipo` by name or code and reports unmatched values (tests with synthetic cells).
- [ ] 5.2 Make the e2e specs and helpers clean up the types they create (or use a recognised prefix); add a test helper that fails if a "Tipo E2E" row remains.
- [ ] 5.3 **Ask first**: remove the five "Tipo E2E …" rows from the local dev database (no activity links), with a reviewed statement.

## 6. Editor

- [ ] 6.1 Activity editor type picker grouped (Formato, Foco, Outros) with descriptions as help text; component tests.

## 7. Wrap-up

- [ ] 7.1 Update `docs/deployment.md`, `docs/testing.md` and `docs/architecture.md` where they mention types.
- [ ] 7.2 `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run test:e2e`.
- [ ] 7.3 `openspec validate activity-types-review --strict`; archive before `catalogue-filters-refresh`.

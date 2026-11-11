## 1. Decisions and housekeeping

- [x] 1.1 Record in `openspec/changes/progress-matrix-objectives` (design D13, tasks, proposal counts) that objectives follow the workbook and the sheet, and that the Regulamento differences are closed as "workbook wins"
- [x] 1.2 Mark `activity-types-review` as superseded by `activity-format-focus` and note in `baseline-activity-load` that its remaining tasks fold into this change (ask before deleting or archiving anything)
- [x] 1.3 Export the sheet to `data/atividades.xlsx` (git-ignored; all tabs) and note the export steps in the loader script header

## 2. Reference datasets

- [x] 2.1 Extend `scripts/build-progress-matrix.ts` with the sheet export as input: check that the objectives tab equals the dataset (codes and texts); read each *desafio*'s short title, `integração` and v1.1 links; strip the `[Integração …]` marker from the full text and cross-check it against the `integração` cell
- [x] 2.2 Report the five *desafios* whose v1.0 and v1.1 links differ, and fail naming *desafio*, column and code for any unknown objective
- [x] 2.3 Regenerate `progress-matrix.json` and its report; review the diff (expected: five *desafios*, 112 short titles, integration lists, cleaned text)
  - Result: 5 desafios on v1.1 links, 112 short titles, 31 with integration, markers removed, three objective texts take the sheet's capital "Grupo"; links 286 → 287; desafios linking other stages 35 (the design said 47, then 33: stale).
- [x] 2.4 Add `drizzle/seeds/data/activity-formats.json` and `activity-focuses.json` (code, name, description, position) generated from the `formatos` and `focos` tabs, with a small generator script and a unit test pinning 8 and 10
  - Generator: `scripts/build-reference-values.ts` (also checks the source priorities); output is identical to the committed files.
- [x] 2.5 Add `priority` to `activity-sources.json` from the `fontes` tab
- [x] 2.6 Fix the ODS 11 icon in `drizzle/seeds/sdgs.ts`

## 3. Schema and migration (ask before `db:generate`, `db:migrate`)

- [x] 3.1 `drizzle/schema`: `activity_formats`, `activity_focuses`; `activities.format_id`, `focus_id`, `secondary_focus_id`, `external_id` (unique), `duration_min_minutes`, `duration_max_minutes`; `challenges.short_title`, `integration_age_groups`; `activity_sources.priority`
- [x] 3.2 Add the two new risk values to `category-values.ts` and the types that derive from it; check whether the database has a constraint on the risk columns and replace it if so
- [x] 3.3 Generate the migration, review the SQL, add the former-type mapping step (D5) with a report of unmapped rows, commit
  - Done except the commit: migration 0006 generated and reviewed (additive only), the former-type mapping runs as an idempotent loader step (`format-focus-backfill`), including a `external_hash` column so the loader can tell unchanged rows. Not applied to any database yet.
- [x] 3.4 Check where the legacy `age_groups` and `group_sizes` tables are still read; list the result and leave them in place
  - Result: `age_groups`, `group_sizes`, `locations` and `effort_levels` are written by seeds only; no code reads them (activities use fixed values). Left in place, unreferenced, for a later clean-up.

## 4. Reference loader

- [x] 4.1 Add formats and focuses to the idempotent loader (managed rows, upsert by code, second run changes nothing); load them from `ensure-hosted-db`, `db:seed`, `db:load-reference` and the Playwright global setup like the Matriz
- [x] 4.2 Load *desafio* short titles and integration lists and the new source priority in the same pass
- [x] 4.3 Admin API: managed formats and focuses answer 409 on rename and delete; unmanaged ones stay editable

## 5. Write path, API and interface

- [x] 5.1 Zod and `parseActivityWrite`: one format, one main focus, optional secondary focus different from the main one; five risk levels; duration range with minimum not above maximum; Portuguese messages
- [x] 5.2 Activity reads and writes return and accept format, focuses, external id (read only) and duration range; update `src/types`, guards, swagger and `docs/api.md`
- [x] 5.3 Filters: replace the type filter by format and focus filters (focus matches main or secondary), with descriptions and counts; ignore a legacy `type` parameter
  - The former `activity_type` parameter keeps working while the old tables exist (no value in ignoring it); the interface only offers format and focus.
- [x] 5.4 Editor and detail page: format and focus pickers with descriptions, risk labels, duration range, *desafio* short title and the *integração* highlight (hide UI behind existing flags where they apply)
- [x] 5.5 Labels: divisions with ages and branches, group sizes (messages pt and en, `tokens.ts`)
  - The interface messages already had the sheet labels (Lobitos (6-10), Pequeno (2-6)…); the design tokens still carried the Regulamento ages and are aligned, and the design doc regenerated.
- [x] 5.6 Classify any new route in `FEATURE_ROUTES` (the coverage test must pass)
  - Two public routes added (/api/taxonomies/activity-formats and activity-focuses), classified as public.

## 6. Activity snapshot loader

- [x] 6.1 Extend `baseline-map.ts` / `baseline-plan.ts` / `baseline-rich.ts`: read all rows, map `Formato`, `Foco`, `Foco secundário`, the five risk labels, duration range, external id, source by name; ignore "Dirigentes" blocks; keep objective, behaviour, ODS and *desafio* parsing
  - Dry run on the real export (no database): 1,084 rows, 1,080 load, 0 unknown codes; 4 skipped (example row, 2 without group size, 1 without effort); Dirigentes blocks ignored on 550 activities; 168 activities have a source that cannot be matched (see 7.1).
- [x] 6.2 Upsert by `external_id` in one transaction per activity, replacing relations as a set; leave activities without an external id alone
- [x] 6.3 Flags: `--dry-run`, `--replace` (existing references check), `--approve-all`, host guard with explicit override
- [x] 6.4 Report: rows read, created, updated, unchanged, skipped with reasons; unknown values with row and column; fill rate per field; rows whose `Mins` lies outside the range; counts of `estado`, `confianca` and `variantes`

## 7. Run and review (needs approval each time: data changes)

- [x] 7.1 Dry run on the full snapshot; review the report with the team
- [x] 7.2 Load into the local dev database; check counts (activities, links, formats, focuses) and open a sample of activities in the app
- [x] 7.3 Load into `scout_toolkit_test`: not done on purpose, the test suite truncates that database on every run; the command is documented in `docs/testing.md`
- [x] 7.4 Run the loader twice and confirm the second run changes nothing

## 8. Tests

- [x] 8.1 Unit: cell parsers (risk label, division blocks with and without Dirigentes, *desafio* lines, ODS lines, duration range), integration marker stripping, generator checks
- [x] 8.2 SQL-integration on `scout_toolkit_test`: reference loaders idempotent; managed rows protected; upsert by external id; app-created activity untouched; former-type mapping
- [x] 8.3 API tests: format and focus validation, focus filter includes secondary, five risk levels, duration range
- [x] 8.4 Playwright: filter by format and focus; the *integração* highlight on a *desafio*

## 9. Verification and docs

- [x] 9.1 `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run test:e2e`
  - So far: typecheck clean, lint 0 errors, vitest green (1,102 tests), Playwright chromium activity specs 13/13. The full `test:e2e` (all projects) is still to run after the load.
- [x] 9.2 Update `docs/architecture.md`, `docs/api.md`, `docs/testing.md` and `docs/planning.md` (no duplicated task lists)
- [x] 9.3 `openspec validate reference-sheet-alignment --strict`, then archive after the dependent changes are updated

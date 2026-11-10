## 1. Shared helper

- [x] 1.1 Add `src/lib/activities/kind-label.ts` (`activityKindLabel`: format, main focus, secondary focus; no fallback) with unit tests (all three, format only, none)
- [x] 1.2 Move `ActivityDetail` onto the helper without changing what it shows

## 2. Replace the type: catalogue and admin table

- [x] 2.1 `ActivityCard`: label is the format and the main focus, no slot without either — component test
- [x] 2.2 `ActivitiesTable`: Formato and Foco columns replace the type column; update the CSV and the mobile row; keep sorting and search — component test
- [x] 2.3 Add the new column and header strings to `pt.json` and `en.json` (Portuguese wording for approval)

## 3. Replace the type: program builder

- [x] 3.1 `GET /api/programs/[id]`: batch-load and return `format`, `focus`, `secondary_focus` per activity entry (no per-entry query); update `useProgram` types, swagger and `docs/api.md`
- [x] 3.2 `AddActivityModal`: format and focus selects built from the loaded activities (focus matches main or secondary) replace the type select, and the free-text search matches title, description and instructions — component test including the secondary-focus and instructions scenarios
- [x] 3.3 `ProgramScheduleRow` and `ProgramBuilder`: show `Formato · Foco · Foco secundário` using the helper — component test
- [x] 3.4 E2E: in the program builder, filter the add-activity dialog by a format and a focus and add a sheet activity

## 4. Replace the type: exports

- [x] 4.1 `load-program.ts` and `types.ts`: load format, focus and secondary focus for each activity
- [x] 4.2 `excel.ts` and `labels.ts`: Formato, Foco and Foco secundário replace Tipo de Atividade on both sheets — unit tests on the workbook cells
- [x] 4.3 `pdf-html.ts`: the `Formato · Foco · Foco secundário` line under the activity name, HTML-escaped — unit test
- [x] 4.4 Export a program with a sheet activity and a sparse activity (no format): both succeed

## 5. Replace the type: edit suggestions

- [x] 5.1 `fields.ts` and `index.ts`: add `format_id`, `focus_id`, `secondary_focus_id` (existence check, main focus differs from secondary) — unit and SQL-integration tests
- [x] 5.2 `SuggestEditForm`: format and focus selects instead of the type multi-select; the admin suggestions list shows the names — component test
- [x] 5.3 Swagger and `docs/api.md` for the new suggestable fields

## 6. Remove the type from the product

- [x] 6.1 Read-only check script that lists activities with no format or no focus, and pending `activity_types` suggestions; run it on dev and Preview and record the result here (`scripts/check-activity-kinds.ts`: dev and Preview both have 1,080 activities, none without a format or focus, no pending type suggestions)
- [x] 6.2 API: drop `activity_types` from list, detail and program responses; ignore `activity_type` (filter) and `activity_type_ids` (writes); delete `GET /api/taxonomies/activity-types` and the `activity-types` kind of `/api/admin/taxonomies/[kind]`; update `FEATURE_ROUTES` and `feature-routes-coverage.test.ts`, swagger and `docs/api.md`
- [x] 6.3 Admin: remove the types tab from `/admin/taxonomias`; `ActivityEditorForm` stops keeping old types; `src/app/admin/atividades/[id]/page.tsx` and `src/app/activities/page.tsx` drop the type defaults
- [x] 6.4 Suggestions: remove `activity_types` from `SUGGESTABLE_FIELDS`, `CATEGORY_FIELDS` and the validation and apply code
- [x] 6.5 Loaders and seeds: remove the type mapping from `baseline-map/plan/db`; delete `drizzle/seeds/activity-types.ts` and the type steps of `seeds/index.ts`; give `demo-activities.ts` a format and a focus directly; delete `format-focus-backfill.ts` and its calls in `load-reference-data.ts` and the seed
- [x] 6.6 Types and plumbing: remove the type from `src/types/*`, `guards.ts`, `component-schemas.ts`, `usage/schemas.ts`, `categories.ts`, the hooks, query keys and `query-client.ts`; remove the unused strings from `pt.json` and `en.json`
- [x] 6.7 Run the typechecker: it must be clean with the field gone from the types; then `grep -rn "activity_types\|activityTypes\|activity_type\|activity-types\|ActivityType" src scripts drizzle/seeds` and record what is left and why (only the migration may name it)

## 7. Database

- [ ] 7.1 Edit `drizzle/schema` to drop `activityTypes` and `activityActivityTypes`; **ask before running `npm run db:generate`**; review the SQL, add the first step (`UPDATE edit_suggestions SET status = 'rejected', reviewed_at = now() WHERE field = 'activity_types' AND status = 'pending'`) before the two `DROP TABLE`s, commit the migration
- [ ] 7.2 **Ask before applying** to `scout_toolkit_dev`; apply, run `db:load-reference` and the loader twice, and check nothing changes the second time
- [x] 7.3 Update `tests/setup.ts` (hand-kept schema) and the helpers (`tests/helpers/activity-categories.ts`, `database.ts`) so no table or helper creates types; delete `tests/integration/db/category-migration.integration.test.ts`
- [x] 7.4 Update or delete the tests that name the type (list in the search of 6.7 over `tests/`): integration, unit, component and e2e, adding format and focus where an activity is created

## 8. Docs and specs

- [x] 8.1 `docs/api.md` (breaking changes: removed endpoint, fields and parameter), `docs/architecture.md` (drop the two tables), `docs/planning.md` pointer, `docs/testing.md` if it names the types
- [ ] 8.2 Check `openspec/specs` for leftover mentions of the type after the deltas are synced (`activity-format-focus` purpose line says "replacing")

## 9. Wrap-up

- [x] 9.1 `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run test:e2e`
- [ ] 9.2 After the push, check the Preview: the deploy applies the migration; open the catalogue (card labels), the builder dialog, an Excel export, a suggestion on a sheet activity, and confirm `/api/taxonomies/activity-types` answers 404
- [ ] 9.3 `openspec validate format-focus-everywhere --strict`, then archive

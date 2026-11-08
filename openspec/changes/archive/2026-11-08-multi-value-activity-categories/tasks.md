## 1. Shared constants and types

- [x] 1.1 Create a shared module for the enum value lists (group sizes, locations, age groups) and reuse it in Drizzle columns, Zod schemas and `src/lib/locale/labels.ts`
- [x] 1.2 Change `src/types/database.ts`, `api.ts`, `components.ts` and `guards.ts` (+ `tests/unit/types/guards.test.ts`) to arrays: `group_sizes`, `locations`, `age_groups`, `activity_types: {id, name}[]`
- [x] 1.3 Update `src/lib/validation/component-schemas.ts` accordingly

## 2. Database

- [x] 2.1 In `drizzle/schema/activities.ts` add `activityGroupSizes`, `activityLocations`, `activityAgeGroups`, `activityActivityTypes` (composite PK, value index, cascade from activities, restrict on type FK); remove the four scalar columns and their indexes, including `activities_filter_idx`
- [x] 2.2 Update `drizzle/schema/indexes.ts` (drop old raw indexes, add link-table ones) and export from `drizzle/schema/index.ts`
- [x] 2.3 Ask first, then run `npm run db:generate`; hand-edit the SQL to create tables → backfill with `INSERT … SELECT` → rewrite pending `edit_suggestions` field keys to plural + JSON arrays → drop old indexes → drop old columns; review and commit
- [x] 2.4 Migration integration test on `scout_toolkit_test`: seed old-shape rows, apply, assert one value per category and unchanged suggestions
- [x] 2.5 Update `drizzle/seeds/demo-activities.ts` and `tests/helpers/database.ts` / `tests/setup.ts` to the new shape (include one multi-value demo activity)

## 3. Domain layer

- [x] 3.1 Add `src/lib/activities/categories.ts` with `loadActivityCategories(ids)` and a filter builder producing the `EXISTS` conditions
- [x] 3.2 Update `ActivityWrite`, `ACTIVITY_FIELDS`, `parseActivityWrite` (dedupe, ≥1 per category, enum + type-id validation, Portuguese errors) in `src/lib/activities/write.ts`
- [x] 3.3 Extend `replaceRelations` for the four tables and wrap create/update in a transaction
- [x] 3.4 Unit tests in `tests/unit/lib/activity-write.test.ts` (empty category, duplicates, unknown value)

## 4. API

- [x] 4.1 `src/app/api/activities/route.ts`: filter via `EXISTS` (location now a list), return arrays, compute `filters.available` from link tables, accept arrays on POST, update swagger comments
- [x] 4.2 `src/app/api/activities/[id]/route.ts` and `src/app/api/activities/mine/route.ts`: GET returns arrays; PUT replaces sets
- [x] 4.3 `src/app/api/admin/activities/**`: create/update/list with arrays
- [x] 4.4 `src/app/api/admin/taxonomies/[kind]/route.ts`: "type in use" check queries `activity_activity_types`
- [x] 4.5 `src/app/api/programs/**` (entries, public copy, orgo) and `src/lib/export/load-program.ts`: load categories via the helper
- [x] 4.6 `src/lib/swagger/config.ts`: new schemas

## 5. Edit suggestions

- [x] 5.1 `src/lib/suggestions/fields.ts`: rename to `group_sizes`, `locations`, `age_groups`, add `activity_types`
- [x] 5.2 Suggest route: validate JSON-array values for those fields; review/accept route: parse and replace the set
- [x] 5.3 `SuggestEditForm` and suggestion history/admin review UI: multi-select input and list rendering
- [x] 5.4 Tests in `tests/unit/lib/suggestions.test.ts` and an integration test for accept replacing a set

## 6. UI

- [x] 6.1 `ActivityEditorForm.tsx`: checkbox-group multi-select per category, at least one required, defaults for edit
- [x] 6.2 `ActivityFilters.tsx`: location becomes multi-select; badges per selected value; update URL param handling in `src/app/activities/page.tsx` and `useActivities` hooks
- [x] 6.3 `ActivityCard.tsx`, `ActivityDetail.tsx`, `ActivitiesTable.tsx`, `src/app/admin/atividades/[id]/page.tsx`: show all values (card: first two + "+k")
- [x] 6.4 Program components (`ProgramBuilder`, `ProgramEntryCard`, `ProgramScheduleRow`, `AddActivityModal`, `AddToProgramModal`, `CreateOrgoEventDialog`, public program page): adapt to arrays; confirm `map-event.ts` needs no change
- [x] 6.5 Add/adjust strings in `src/messages/pt.json` and `en.json` (both)

## 7. Exports

- [x] 7.1 `src/lib/export/types.ts`, `labels.ts`, `excel.ts`, `pdf-html.ts`: arrays joined with ", " using existing labels
- [x] 7.2 Update `tests/unit/lib/export/*` and `tests/integration/api/program-export.integration.test.ts`

## 8. Tests and verification

- [x] 8.1 Update the remaining fixtures listed by `npm run typecheck` (unit components, hooks, API tests, `tests/integration/api/*`)
- [x] 8.2 Integration test: catalogue filter matches via any value, one row per activity, categories AND-combined
- [x] 8.3 E2E: admin creates an activity with two age groups and two types; catalogue filter finds it (`tests/e2e/admin/activities.spec.ts`, `tests/e2e/activities/propose.spec.ts`)
- [x] 8.4 Run `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run test:e2e`

## 9. Follow-ups

- [x] 9.1 Update `baseline-activity-load` and `admin-activity-excel-import` plans to accept lists instead of collapsing; update `docs/planning.md` entry

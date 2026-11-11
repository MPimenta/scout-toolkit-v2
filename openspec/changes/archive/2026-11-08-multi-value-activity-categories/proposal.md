## Why

Today an activity has exactly one group size, one location, one activity type and one age group (division). Real activities don't fit: a game works for Lobitos and Exploradores, can be played inside or outside, with small or large groups, and belongs to more than one type. A single value forces leaders to duplicate activities or classify inaccurately, and makes filters miss good matches. The sheet behind `baseline-activity-load` already holds comma-separated values that we would otherwise have to collapse.

## What Changes

- An activity can be linked to **one or more** values for each of: group size, location, activity type, age group. At least one value per category remains required.
- Replace the single-valued columns `group_size`, `location`, `age_group` (text enums) and `activity_type_id` (FK) on `activities` with four join tables, modelled like the existing `activity_sdgs` (final names in `design.md`).
- A committed migration copies every existing value into the join tables, then drops the old columns and their indexes.
- **BREAKING** (API shape): activity payloads return arrays (`group_sizes`, `locations`, `age_groups`, `activity_types`) instead of scalars; write payloads accept arrays.
- Catalogue filters keep multi-select semantics: an activity matches a category when any of its values is selected; categories combine with AND. Location becomes multi-select.
- Admin and user activity forms get multi-select inputs; card, detail, admin table, program views, Excel/PDF exports and Orgo mapping show all values.
- Edit suggestions for these fields carry a list of values.
- `effort_level` stays single-valued (not requested).

## Capabilities

### New Capabilities

- `activity-categories`: an activity's many-to-many association with group sizes, locations, activity types and age groups, including filter semantics, migration and display.

### Modified Capabilities

- `admin-activities`: create/update accept lists for the four categories, at least one value each.
- `edit-suggestions`: category fields in suggestions take a list of values.

## Impact

- DB: `drizzle/schema/activities.ts`, `drizzle/schema/indexes.ts`, new committed migration with data backfill (ask before running any `db:*` command), seed `demo-activities.ts`.
- API: `src/app/api/activities/**`, `src/app/api/admin/activities/**`, `src/app/api/admin/taxonomies/[kind]/route.ts` (type-in-use check), `src/app/api/programs/**`, `src/lib/swagger/config.ts`.
- Domain: `src/lib/activities/write.ts`, `src/lib/suggestions/fields.ts`, `src/lib/export/*`, `src/lib/orgo/map-event.ts`, `src/types/*`, `src/lib/validation/component-schemas.ts`.
- UI: `ActivityEditorForm`, `ActivityFilters`, `ActivityCard`, `ActivityDetail`, `ActivitiesTable`, program components, `src/messages/pt.json` and `en.json`.
- Tests: many unit/integration/E2E fixtures use scalar fields and must be updated.
- Coordination: `add-activity-instructions` should be archived first (it also edits the suggestion field list). `baseline-activity-load` (multi-value collapse rules) and `admin-activity-excel-import` (columns) should be updated to use lists once this lands.

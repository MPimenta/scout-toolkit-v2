## Context

After `reference-sheet-alignment`, an activity carries `format`, `focus` and `secondary_focus` (each `{ id, code, name }`), and the former `activity_types` list is empty for every sheet activity. Searching `src/`, `tests/`, `drizzle/`, `scripts/` and `docs/` for the type (`activity_types`, `activityTypes`, `activity_type`, `activity-types`, `ActivityType`) finds about 60 source files and 50 test files. Groups:

- **Display:** `ActivityCard`, `ActivitiesTable`, `ActivityDetail` (already prefers format), `ProgramScheduleRow`, exports.
- **Choose:** `AddActivityModal` (type select), `ActivityEditorForm` (keeps old types on edit), `SuggestEditForm`.
- **API:** activity list, detail and write routes, `GET /api/programs/[id]`, `GET /api/taxonomies/activity-types`, the `activity-types` kind of `/api/admin/taxonomies/[kind]`, the `activity_type` filter, swagger.
- **Admin:** the types tab of `/admin/taxonomias`.
- **Data and loaders:** `drizzle/schema` (`activity_types`, `activity_activity_types`), seeds (`activity-types.ts`, demo activities), `baseline-map/plan/db`, `format-focus-backfill`, `categories.ts`, `tests/setup.ts` (hand-kept schema).
- **Types and plumbing:** `src/types/*`, `guards.ts`, `component-schemas.ts`, `useActivities`/`useActivity`/`useProgram` hooks, query keys, `usage/schemas.ts`, `pt.json`/`en.json`.

## Goals / Non-Goals

**Goals:**
- Wherever the type was shown or chosen, show or choose the format and focus.
- Then remove the type completely: API, admin, code, data, tests, docs and specs. No fallback, no legacy parameter.
- One label helper so every place reads the same.

**Non-Goals:**
- Changing the formats and focuses themselves (`reference-sheet-alignment`) or managing them in the admin (`admin-revamp`).
- Keeping any record of which type an activity once had.

## Decisions

### Two phases in one change, replace first, remove second
Phase 1 (replace) makes every screen and export work from format and focus. Phase 2 (remove) deletes the type. Doing them in this order keeps the app working after each commit and lets the removal be a pure deletion that the typechecker verifies: once the field is gone from `src/types`, every remaining read fails to compile.

### One label helper
`activityKindLabel(activity)` in `src/lib/activities/kind-label.ts` returns the format name and the main and secondary focus names. Cards, the table, program rows and the exports call it. The detail page moves onto it too. An activity with no format and no focus has no label (no fallback to anything else).

### Card shows the format, not the focus
The card has one label slot. It shows the format; the focus is on the detail page and in the filters.

### Builder filters come from the loaded activities
`AddActivityModal` already builds its type list from the activities it holds. It builds format and focus lists the same way, with "Todos" first. The focus filter matches the main or the secondary focus, as in the catalogue.

### Program API returns the values
`GET /api/programs/[id]` adds `format`, `focus` and `secondary_focus` to each entry's activity, batch-loaded like the other categories (no per-entry query).

### Exports
The Excel program and activity details sheets replace "Tipo de Atividade" with "Formato", "Foco" and "Foco secundário". The PDF shows one line `Formato · Foco · Foco secundário` under the activity name when the activity has them.

### Suggestions: ids, not names
A suggestion for `format_id`, `focus_id` or `secondary_focus_id` stores the value id as text. Validation: the id exists; the resulting main focus differs from the resulting secondary focus; the format and the main focus cannot be cleared. Accepting it sets the column. The `activity_types` field is removed: new suggestions for it answer 400 (unknown field), and the migration marks any pending one as rejected first, so nothing is stranded.

### Removing the data
One committed migration, generated from the schema change and reviewed:
1. `UPDATE edit_suggestions SET status = 'rejected', reviewed_at = now() WHERE field = 'activity_types' AND status = 'pending'`.
2. `DROP TABLE activity_activity_types`, then `DROP TABLE activity_types`.
The generated migration is destructive, so it is not generated or applied without the user's approval. Before it, a read-only script lists the activities with no format or no focus, so nobody finds out afterwards. Today that is only a few old demo activities (the unmapped type "Serviço" has no equivalent in the sheet): they stay in the catalogue without a label until an admin edits them.

### API compatibility
`activity_type_ids` on a write is ignored (no error), so an old client keeps working. `activity_types` disappears from responses, `GET /api/taxonomies/activity-types` answers 404 and the `activity_type` query parameter is ignored. This is a deliberate breaking change recorded in `docs/api.md`; the app is the only known client.

### The hand-kept test schema
`tests/setup.ts` mirrors the schema by hand (`CREATE TABLE IF NOT EXISTS`). It drops the two tables, and `tests/helpers/activity-categories.ts` and the other helpers stop creating types. The old category-migration integration test (about a one-time backfill) is deleted with the migration it covered.

## Risks / Trade-offs

- **Irreversible:** the type data is gone after the migration. Mitigated by the obsolescence above and the pre-check script.
- **Large mechanical diff:** about 110 files. Mitigated by phase ordering and by letting the typechecker find leftovers (task 6.1 also greps).
- **Excel consumers** that read the old column by header lose it: noted in `docs/api.md`.
- **Hosted databases:** Preview applies the migration on deploy (`drizzle-kit migrate`). Production Azure has no data yet, so it starts clean.

## Open Questions

- Should the card also show the main focus as a second, lighter label? Default: no.
- Should the builder keep a free-text search next to the selects? Default: unchanged.
- The few old demo activities without a format or focus: delete them, or give them a format and focus by hand? Default: leave them until an admin edits them.

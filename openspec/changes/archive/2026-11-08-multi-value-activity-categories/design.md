## Context

`activities` stores `group_size`, `location`, `age_group` as text enum columns and `activity_type_id` as a FK to `activity_types`. Separate taxonomy tables `group_sizes`, `locations`, `age_groups` exist and are seeded, but activities do not reference them (they have no stable key, only a name). Educational goals and SDGs already use join tables (`activity_educational_goals`, `activity_sdgs`) with composite PKs and `replaceRelations()` in `src/lib/activities/write.ts`. The catalogue list route (`src/app/api/activities/route.ts`) filters with `inArray` on the scalar columns, and many readers select the scalars directly (detail route, program loaders, exports, Orgo mapping, tables, cards). See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Many-to-many for the four categories with the same shape as SDGs, so writes, reads and tests follow an established pattern.
- Zero data loss and unchanged filter results after migration.
- Single migration that is safe on Neon (applied by `drizzle-kit migrate` at deploy).

**Non-Goals:**
- Making the `group_sizes`/`locations`/`age_groups` taxonomy tables admin-editable or the source of truth (admin-taxonomies stays about types, areas, goals, SDGs).
- Changing `effort_level`, duration, or the labels shown for enum values.
- Weighting or ranking by "primary" value.

## Decisions

**1. Join tables keyed by enum value for the three enum categories; FK join for types.**
- `activity_group_sizes(activity_id, group_size)`, `activity_locations(activity_id, location)`, `activity_age_groups(activity_id, age_group)` store the existing enum string (same `enum` lists as today, defined once in a shared constants module and reused by Zod and the Drizzle columns).
- `activity_activity_types(activity_id, activity_type_id)` references `activity_types` (`onDelete: restrict`, preserving today's "type in use → 409").
- All have composite PK `(activity_id, value)`, an index on the value column for filtering, and `onDelete: cascade` from `activities`.
- Alternative: point the three at the existing taxonomy tables by uuid. Rejected for now: those tables have no unique key, seeds are `onConflictDoNothing` without a constraint (duplicates possible), the UI/labels/locale code is all keyed on the enum strings, and it would add a mapping step with no user benefit. Revisit if admins need to edit these lists.

**2. Reads return arrays; no scalar kept.**
Keeping both scalar and array invites drift. API and types expose `group_sizes`, `locations`, `age_groups`, `activity_types` (the last as `{id, name}[]`, replacing `activity_type`). Arrays are ordered by a fixed enum order (types by name) for stable output.

**3. Filtering with `EXISTS`, not joins.**
For each selected category add `EXISTS (SELECT 1 FROM activity_x WHERE activity_id = activities.id AND value IN (...))`. This keeps one row per activity (no DISTINCT/paging distortion) and AND-combines categories. The returned `filters.available` option sets are computed from the link tables.
The composite index `activities_filter_idx` on the old columns is dropped; per-link-table value indexes replace it. Catalogue size is small, so no composite is needed.

**4. List/detail loading via one extra query per category, grouped in code.**
After fetching the page of activity ids, load links with `inArray(activity_id, ids)` per table and merge. Avoids row multiplication and keeps the existing pagination query unchanged apart from filters. Shared helper `loadActivityCategories(ids)` in `src/lib/activities/categories.ts`, reused by the detail route, program loaders and exports.

**5. Write path.**
`ActivityWrite` takes arrays; `parseActivityWrite` dedupes, requires ≥1 per category, validates enum values and (via a query) that type ids exist. `replaceRelations` is extended to delete-and-insert all four tables inside the same transaction as the activity write (wrap create/update in `db.transaction`; today relations are written without one).

**6. Migration (single committed migration, data-preserving).**
In order, in one file: create the four tables → `INSERT … SELECT` from the old columns → drop old indexes → drop old columns. The old `activity_type_id` NOT NULL FK is dropped last. No down migration; rollback = restore from Neon branch/backup taken before deploy. Generated with `db:generate`, then hand-edited to add the backfill statements, reviewed and committed (ask before running any `db:*`).

**7. Edit suggestions.**
`suggested_value` is a text column. For the four fields store a JSON array string (e.g. `["scouts","rovers"]`); the suggest route validates it, the review/accept route parses it and replaces the set. Field keys are renamed to the plural names (existing pending rows for `group_size`, `location`, `age_group` are rewritten by the migration to the plural key and a one-element JSON array; there is no suggestable `activity_type` today, so `activity_types` is new). UI renders the suggested list with labels.

**8. UI.**
Editor form: multi-select (checkbox group) per category, all four required (≥1). Filters: location changes from a single select to multi-select like the others; badges list each selected value. Cards/table show up to N labels with "+k" overflow; detail and exports show all, comma-joined (Excel cell) or separate chips (detail). All new labels go in `pt.json` and `en.json`.

**9. Orgo mapping and program views.**
Only display strings change (join with ", "); Orgo event fields do not consume these categories, so confirm during implementation that `map-event.ts` `location` is the dialog's free-text location and needs no change.

## Risks / Trade-offs

- [Wide blast radius: ~40 source files and ~30 tests read the scalars] → Do the type change first (`database.ts`, `api.ts`, `components.ts`, guards) and let `npm run typecheck` drive the remaining edits; keep the task list grouped by layer.
- [Backfill or drop step fails halfway on a hosted DB] → Single transactional migration; take a Neon branch before deploying Production; rehearse on a copy of Preview data.
- [Pending suggestions rewritten incorrectly] → Covered by the migration test with fixture suggestions; if unsure, accept dropping pending suggestions on these fields (they are rare) and note it.
- [Filters returning more results than before] → Expected: that is the feature. Existing activities have one value each, so their results are unchanged until edited.
- [In-flight changes touch the same code] → Archive `add-activity-instructions` first; update `baseline-activity-load` and `admin-activity-excel-import` to emit lists afterwards. `baseline-activity-load` currently collapses multi-valued cells, so it should wait for this change or be adjusted.
- [Enum value in a join table has no FK or CHECK] → Validated by Zod/`parseActivityWrite` and typed in Drizzle; a CHECK was left out so the migration snapshot stays in sync with the schema. Acceptable for a closed, rarely changing set.

## Open Questions

- Should the catalogue card show all values or the first few with overflow? (Default: first two plus "+k"; purely visual, tasks assume this.)
- Should Excel export put multiple values in one cell (", ") or use `;`? (Default: ", ".)

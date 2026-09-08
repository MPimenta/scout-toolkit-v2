## Context

See proposal.md. Activities already have a many-to-many to `educational_goals` (which belong to `educational_areas`: Social, Liderança, Criatividade, Cidadania, Competências Técnicas) and an `activity_type_id` (Jogos, …). List/detail payloads, tile/table badges, the advanced-filters checkbox grid, and `parseActivityWrite` / `replaceRelations` all follow the goals pattern. Challenge types are a third catalogue. `ActivityEditorForm` today has no objectives or SDG controls even though the write API accepts `educational_goal_ids` / `sdg_ids`. Educational areas already seed via `drizzle/seeds/educational-areas.ts` with upsert-by-unique-name; challenge types follow that pattern.

## Goals / Non-Goals

**Goals:**

- Mirror the goals pattern for a new challenges catalogue and `activity_challenges` junction
- Keep educational areas/goals and activity types untouched
- Make association possible in the editor (objectives + challenges controls)

**Non-Goals:**

- Excel import column (leave `admin-activity-excel-import` unchanged)
- Program summary, schedule, or export
- Edit-suggestions for challenge fields
- Official full challenge catalogue beyond the ten seeded examples (admins can add more)
- Icons or codes on challenge types / challenges unless a later change needs them

## Decisions

### 1. Separate `challenge_types` from educational areas and activity types

Challenge types are not `educational_areas` and not `activity_types`. A dedicated table keeps those catalogues independent. UI label: **Tipos de desafio** vs existing **Tipos** (activity types) and **Áreas** (educational areas). Alternative: reuse educational areas — rejected; names and purpose differ.

### 2. Schema shaped like goals, without code/icon

`challenge_types(id, name unique, created_at)`, `challenges(id, type_id FK cascade, name, description, created_at)`, `activity_challenges(activity_id, challenge_id)` composite PK. No `code` or `icon` in this change (the request is id / name / description / type). Alternative: copy goal `code`+`icon` now for import later — deferred; import is out of scope.

### 3. Same list/filter contract as objectives

Query param `challenges` (comma-separated ids), any-of match, payload key `challenges` next to `educational_goals`. Filter UI reuses the educational-goals checkbox grid (not a new dropdown widget). Truncation: 3 badges on the tile, 2 on the table. Detail shows type name, not educational area.

### 4. Shared write path

Extend `ActivityWrite` with `challenge_ids`, replace the junction in `replaceRelations`. Admin and leader submit both pick it up. Unknown ids → 400.

### 5. Editor: add objectives and challenges together

Place a challenges multi-select immediately after a new educational-objectives multi-select on `ActivityEditorForm` (admin create/edit and leader propose). SDGs stay as they are unless already present; this change does not require adding an SDG control.

### 6. Seed seven types, ten challenges, and demo-activity links

Add `drizzle/seeds/challenge-types.ts` (wired from `drizzle/seeds/index.ts`, before demo activities). Upsert types by unique `name`, then upsert challenges by unique `name` with `type_id`. Each challenge has exactly one type. Extend `demo-activities.ts` so each of the five demo activities is linked to the two challenges listed in the spec (lookup activity and challenge by name; `onConflictDoNothing` on the junction). Admins can still CRUD types and challenges after seed.

### 7. Taxonomy admin tabs

Add tabs `challenge-types` and `challenges` beside the existing four. Public GET `/api/taxonomies/challenge-types` and `/api/taxonomies/challenges`. Admin writes stay under `/api/admin/taxonomies/{kind}`. Delete 409 when a challenge (or a type whose challenges) is linked to an activity.

## Risks / Trade-offs

- [Two “tipo” catalogues confuse admins] → Label the new tab **Tipos de desafio**; do not merge with activity types or educational areas
- [Seed vs later admin edits] → Upsert by unique name; do not wipe types or challenges an admin renamed if the original seed name is gone
- [Excel import will omit desafios] → Call out as a follow-up on `admin-activity-excel-import`, not this change
- [Filter + join volume] → Follow the existing goals/SDG post-filter; index `activity_challenges` like the other junctions

## Migration Plan

1. Drizzle tables + generate migration; seed types/challenges
2. Public GET + activity read/write/filter
3. Tile, table, detail, filters, editor, taxonomy tabs
4. Tests on `scout_toolkit_test`
5. Rollback: drop the three tables; educational goals and activity types unchanged

## Open Questions

None that block this design.

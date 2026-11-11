## Why

The catalogue's educational objectives are placeholders: five invented areas and fifteen generic goals ("Comunicação Eficaz", "Primeiros Socorros"…) that do not exist in the Escoteiros de Portugal framework. The association's *Matriz de Progresso Pessoal* defines the real thing: six development areas, 40 general objectives, 174 specific objectives that differ **per age group**, and 112 *desafios* each linked to the objectives they develop. Activities should be matched against those real, age-specific objectives, and a leader should see at a glance which age group an objective belongs to.

## What Changes

- Replace the placeholder areas and goals with the Matriz: 6 areas (Afetivo, Carácter, Espiritual, Físico, Intelectual, Social), 20 educational paths (*Caminhos Educativos*, from the Regulamento do Programa para Jovens v1.2), 40 general objectives, 174 specific objectives (one per age group, 13 shared by Exploradores and Clã), 7 challenge types, 112 *desafios* and their 286 objective links (the workbook lists 287; one challenge repeats a code).
- Commit the Matriz as a versioned dataset plus a generator script that rebuilds it from the exported workbook. The dataset is **reference data**: a loader applies it idempotently on **every** environment (local, test, e2e, Preview, Production), independent of the demo activities.
- Retire the old placeholder goals and their activity links, identified by their known codes. Goals an admin created are left alone.
- Objectives are specific to an age group. An activity can only be linked to objectives that belong to at least one of its age groups; the editor offers only those, grouped by area and general objective.
- Objective pills in the UI (card, detail, filters, program views) take the **colour of their age group**, with the objective code and the age-group name as text so colour is never the only cue. The colours come from the division tokens defined by the `brand-design-system` change (the official Regulamento colours: Alcateia yellow, Tribo de Escoteiros dark green, Tribo de Exploradores dark blue, Clã red, Chefia white); this change defines no colour values.
- Where the Regulamento (v1.2, Dec 2024) and the workbook (v1.0, 2023) differ on an objective's wording or code, the generator reports every difference, defaults to the Regulamento, and never resolves one silently.
- Admin taxonomy rows that come from the Matriz are read-only in the admin UI and API; admins can still add objectives of their own.
- The local dev data is enriched so several demo activities carry multiple group sizes, multiple age groups and multiple objectives (age-matched), and the demo seed is updated to match.
- **BREAKING** (API shape): an educational goal now carries `general_objective`, `age_groups` and keeps `area`; goal codes change (for example `SOCIAL_COMM` becomes `1S.1`). Existing links to placeholder goals are removed.

## Capabilities

### New Capabilities

- `progress-matrix`: the reference dataset (areas, general and specific objectives, challenge types, challenges and their links), its generator, and the idempotent per-environment loader.
- `activity-objectives`: how activities link to age-specific objectives, the editor and filter rules, and age-group-coloured pills.

### Modified Capabilities

- `admin-taxonomies`: goals gain a general objective and age groups; Matriz-managed rows cannot be edited or deleted; the delete rules account for the new tables.
- `admin-activities`: objective ids must belong to one of the activity's age groups.
- `visual-system`: objective pills consume the division colour tokens from `brand-design-system` and define no colours of their own.

## Impact

- DB: `drizzle/schema/taxonomies.ts` (+ new tables for general objectives, goal age groups, challenge types, challenges, challenge links), new committed migration (ask before any `db:*` command), `tests/setup.ts` hand-written schema.
- Seeds and tooling: new reference loader and generator script, `drizzle/seeds/educational-areas.ts` and `demo-activities.ts` rewritten, `drizzle/seeds/index.ts`, `scripts/ensure-hosted-db.mjs` (reference data must load even when the catalogue is not empty), e2e setup, `package.json`.
- API: `src/app/api/taxonomies/educational-goals`, `educational-areas`, `src/app/api/admin/taxonomies/[kind]`, `src/app/api/activities/**` (goal payload shape, age-match validation), `src/lib/activities/write.ts`, exports.
- UI: `ActivityEditorForm`, `ActivityFilters`, `ActivityCard`, `ActivityDetail`, `ProgramSummary`, program entry components, admin taxonomies page, `src/app/globals.css`, `docs/brand-handoff.md`.
- Resolved inputs: the area names are confirmed (and match the Regulamento: Física, Afetiva, do Carácter, Espiritual, Intelectual, Social), and the division colours are defined by `brand-design-system`.
- Still needed: the Regulamento PDF placed under the git-ignored `data/` folder so the generator can diff its objective text against the workbook.
- Related fix: both the workbook and the Regulamento show "Exploradores" is the 14–17 section (`adventurers`), not `scouts`. `baseline-activity-load`'s mapping of that word must be corrected.
- Coordination: `multi-value-activity-categories` should be archived first; this change builds on its age-group join table and edits the same `admin-activities` spec.

## 1. Inputs to confirm first

- [x] 1.1 Division colours are defined by `brand-design-system` (Regulamento Pantone references, Chefia white). Tasks 7.1 and 7.2 below wait for that change's tokens (its task 1.2) and `DivisionPill` (its task 3.8); everything else does not.
- [x] 1.2 Area names confirmed (Afetivo, Carácter, Espiritual, Físico, Intelectual, Social); they also match the Regulamento.
- [x] 1.4 Put the Regulamento do Programa para Jovens v1.2 PDF under the git-ignored `data/` folder (the generator reads its Anexo 1 text).
- [x] 1.3 Correct `baseline-activity-load`: the sheet confirms "Exploradores" is the 14–17 section (`adventurers`), so change `mapAgeGroups` and its tests accordingly (keep "Pioneiros" as an alias of `adventurers`), and drop the "Exploradores" open question from that change.

## 2. Schema and migration

- [x] 2.1 In `drizzle/schema/taxonomies.ts` add `educational_paths`, `general_objectives` (with `path_id`), `educational_goal_age_groups` (composite PK, value index), `challenge_types`, `challenges` (single `age_group` enum value), `challenge_goals` (composite PK); add nullable `general_objective_id` to `educational_goals`; add `is_managed` to areas, general objectives, goals, challenge types and challenges. Register them in `drizzle/schema/index.ts` and `indexes.ts`.
- [x] 2.2 **Ask first**, then `npm run db:generate`. Review the SQL (additive only, no deletes) and commit it with its snapshot and journal entry.
- [x] 2.3 Mirror the new tables and columns in `tests/setup.ts` (hand-written schema, `IF NOT EXISTS`), including the truncation list.

## 3. Dataset and generator

- [x] 3.0 Transcribe the 20 educational paths and their general objectives from Anexo 1 into a reviewed constant, with a test that every general objective is assigned to exactly one path.
- [x] 3.1 Write `scripts/build-progress-matrix.ts <workbook.xlsx> <regulamento.pdf>`: read the Regulamento's Anexo 1 text, normalise codes (`4F1.1` to `4F.1.1`), diff every objective against the workbook, write `progress-matrix.report.json` (differences, one-sided codes, links to missing codes, verbatim repeats such as `4A.2`), then parse the code grammar, carry blank-first-cell rows to the general objective above, map stage columns to age groups, expand `3-4` ranges, skip "[sem objetivo específico]", derive each *desafio*'s age group from its column band, assign stable type and challenge codes, resolve all links, fail naming the type, column and code on any miss, and write the JSON in a fixed order.
- [x] 3.2 Run it on the exported workbook (kept under the git-ignored `data/`), commit `drizzle/seeds/data/progress-matrix.json`, and print a report: totals, shared objectives, and the number of *desafios* that link other stages' objectives.
- [x] 3.3 Unit tests: totals 6 / 40 / 174 / 7 / 112 / 286; the 13 shared codes carry two age groups; `7E` has no Alcateia objective; every link resolves; running the generator twice is byte-identical.

## 4. Loader and environment wiring

- [x] 4.1 `src/lib/reference-data/progress-matrix.ts`: `applyProgressMatrix(executor, dataset)` with upserts by code in dependency order, link replacement, `is_managed = true` on written rows, area/general-objective consistency check, and placeholder retirement by code list with a logged count of removed links. Add a thin CLI `scripts/load-reference-data.ts` (refuses nothing: it targets whatever `DATABASE_URL` the environment gives it, like the existing seed).
- [x] 4.2 Call it from `drizzle/seeds/index.ts` (replacing `seedEducationalAreas`), from `scripts/ensure-hosted-db.mjs` on every deploy after `drizzle-kit migrate`, from `tests/e2e/global-setup.ts`, and via a test helper that accepts a small fixture dataset.
- [x] 4.3 Integration tests: fresh DB gets all counts; second run changes nothing; a non-empty catalogue keeps its activities; a placeholder goal and its link are removed while an admin-created goal survives; a changed text in the dataset is updated.
- [x] 4.4 Add `npm run db:load-reference` to `package.json` and document it in `docs/testing.md` and `docs/deployment.md`.

## 5. API and write validation

- [ ] 5.1 Extend `GET /api/taxonomies/educational-goals` and `educational-areas` as in design D9 (general objective, age groups, repeated `age_group` filter); update `src/types/*`, `src/lib/validation/component-schemas.ts`, guards and `src/lib/swagger/config.ts`.
  - Done: both routes and the activity payloads; still open: `src/lib/swagger/config.ts`, `component-schemas.ts`, `guards.ts`.
- [x] 5.2 Add `verifyActivityGoals(goalIds, ageGroups)` in `src/lib/activities/write.ts` and call it from the admin, user and PATCH routes before writing; return the Portuguese 400 naming the goal codes.
- [ ] 5.3 Activity payloads embed goals in the new shape; the catalogue `educational_goal` filter keeps OR semantics; Excel/PDF exports show goal codes.
- [x] 5.4 Integration tests for the four `activity-objectives` write scenarios (match, mismatch, several age groups with a shared objective, removing an age group) and for the filter returning one row per activity.

## 6. Admin taxonomies

- [x] 6.1 Goal create/update takes `general_objective_id` and `age_groups` (at least one); reject an area that differs from the general objective's area with 400; add admin CRUD for general objectives.
- [x] 6.2 Return 409 for update/delete of any `is_managed` row; extend the in-use and has-children delete checks as in the `admin-taxonomies` delta.
- [x] 6.3 Admin taxonomies page: managed rows read-only, goal form with general objective and age groups.
- [x] 6.4 Tests for the new 400 and 409 cases and for the delete rules.

## 7. Editor, filters and pills (needs `brand-design-system` tasks 1.2 and 3.8)

- [x] 7.1 Confirm the division tokens exist in `src/app/globals.css` (defined by `brand-design-system`); this change adds no colour values.
- [x] 7.2 `ObjectivePill` component built on `DivisionPill` (code, truncated title, `aria-label` and `title` with the division name, one pill per matching activity age group) plus unit tests including the shared-objective scenarios and the Clã near-black label.
- [ ] 7.3 Use it in `ActivityCard` (first three + "+k"), `ActivityDetail`, `ActivityFilters`, `ProgramSummary` and the program entry components.
- [x] 7.4 `ActivityEditorForm`: objectives grouped by area and general objective for the selected age groups only, with search, a hint when none is selected, and auto-deselect with a message when an age group is dropped.
- [x] 7.5 `ActivityFilters`: objective list follows the age-group selection and drops selections that no longer apply.
- [ ] 7.6 Component tests for the editor and filters; add an E2E case: pick two age groups, pick matching objectives, save, see two coloured pills.
  - Done: unit tests for the pill and the picker; still open: filter tests and the E2E case.

## 8. Local data and demo seed

- [x] 8.1 Rewrite `drizzle/seeds/demo-activities.ts` to link Matriz codes and to make at least four activities multi-valued (two group sizes, two age groups, two to four age-matched objectives).
- [x] 8.2 **Ask first.** Local-only script that refuses a non-local `DATABASE_URL`, re-links the existing local activities to Matriz objectives and applies the same multi-value pattern; run it on `scout_toolkit_dev` after 4.x and check the app on port 3100.

## 9. Wrap-up

- [ ] 9.1 Run `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run test:e2e`.
- [ ] 9.2 `openspec validate progress-matrix-objectives --strict`; update `docs/api.md`, `docs/architecture.md` and `docs/planning.md` where they describe goals.
- [ ] 9.3 Archive order: `add-activity-instructions`, then `multi-value-activity-categories`, then this change.

## Context

See `proposal.md` for motivation.

**Source.** The *Matriz Progresso Pessoal* workbook (3 sheets, read and parsed end to end):

- `Objetivos`: 40 general objectives × four stage columns (Alcateia, Escoteiros, Exploradores, Clã) → 187 filled cells, 174 distinct specific objectives. 13 codes end in `3-4` and appear identically in both the Exploradores and Clã columns. Rows with a blank first cell continue the general objective above (for example `4E` has sub-groups `4E.1.x` and `4E.2.x`). Cell `7E` / Alcateia is "[sem objetivo específico]". A "Tipos" column lists the challenge types that serve each general objective.
- `Desafios-Objetivos`: 7 challenge types × 16 columns (`A`–`P`), each *desafio* with its text and the list of objective codes. The 16 columns fall in four bands of four that match the four stages. All 287 listed codes (286 distinct per challenge) parse and exist in `Objetivos`; stage digits in the codes agree with the `Objetivos` columns in every case.
- `Matriz Progresso`: the same *desafio* texts, without links. Used only as a cross-check.
- *Regulamento do Programa para Jovens* v1.2 (Dec 2024), Anexo 1: the official, newer source for objective codes and text. It adds a level the workbook lacks, the 20 *Caminhos Educativos* between area and general objective, confirms the six area names, and names the divisions Alcateia (7–10½), Tribo de Escoteiros (10½–14), Tribo de Exploradores (14–17) and Clã (17–21). Spot checks found differences from the workbook (v1.0, 2023): code format (`4F1.1` vs `4F.1.1`), `6C.2-3` merged where the workbook has `6C.2` and `6C.3`, the Clã `4F2.3-4` label on text the Exploradores column labels `4F2.3`, and `4A.2`, whose Regulamento text repeats `3A.2`.

Code grammar: `<n><area>.[<sub>.]<stage>[-<stage>]`, area letter in `A C E F I S`, stage `1`–`4` (1 Alcateia, 2 Escoteiros, 3 Exploradores, 4 Clã).

**Current model.** `educational_areas` (5 invented rows) → `educational_goals` (15 invented rows, `area_id`, `title`, `description`, unique `code`, `icon`), linked to activities by `activity_educational_goals`. Activity age groups are text-enum rows in `activity_age_groups` (`cub_scouts | scouts | adventurers | rovers | leaders`). Seeds run through `drizzle/seeds/index.ts`; `scripts/ensure-hosted-db.mjs` seeded hosted databases **only when the catalogue was empty** (before the reference loader of D5). The local dev DB has 15 activities, one value per category (migration `0002` is applied; no activity is multi-valued yet).

**Constraints.** Plain Portuguese `text`, UUID keys, committed migrations only, no invented brand colours (`visual-system`), ask before any `db:*` command.

## Goals / Non-Goals

**Goals:**

- One committed, regenerable dataset that every environment loads automatically.
- Activities matched to objectives of their own age groups, enforced on the server.
- A local dev database that exercises multi-value group sizes, age groups and objectives.

**Non-Goals:**

- No UI for browsing or choosing *desafios* yet; they are stored and linked so a later change can build on them.
- No automatic suggestion of objectives from an activity's text.
- No English translation of Matriz text (catalogue content stays Portuguese).
- No Dirigentes objectives: the Matriz has none, so no objective belongs to `leaders` and no activity link may use that division. An activity can still list `leaders` among its age groups (it is suitable for them) without carrying objectives for them.
- No import path for admins to upload a newer Matriz (a new version is a regenerated dataset in a commit).

## Decisions

**D1. Keep `educational_areas` / `educational_goals`; add one level above goals.**
Areas stay (6 rows replace 5). `educational_goals` becomes the *specific objective* table (`title` = Matriz text, `code` = e.g. `1A.2`). A new `general_objectives` table (`id`, `area_id`, `code`, `title`) sits between them, and goals get a nullable `general_objective_id`. Keeping the table and route names avoids touching every consumer (≈85 files mention goals) and keeps `activity_educational_goals` unchanged.
*Alternative:* new tables named `objectives` and migrate links. Rejected: a rename with no behavioural gain, and it would break the public API paths for no reason.
`area_id` stays on goals (the UI shows it) and must equal the area of the general objective; the loader and the admin API both check it.
`general_objective_id` is nullable in the database so older admin-created goals survive the migration; the API requires it for every new goal.

**D2. Age groups on goals through a join table.**
`educational_goal_age_groups (goal_id, age_group)` with composite PK and a value index, the same shape as `activity_age_groups` and the same `AGE_GROUP_VALUES` enum. A `3-4` objective is one row with two links.
*Alternatives:* one goal row per (code, age group) with codes like `4S.1.3-4#rovers`: duplicates text and breaks code uniqueness. A Postgres array column: inconsistent with the rest of the schema and awkward to filter.

**D3. Challenges get three tables.**
`challenge_types (id, code, name, position)`, `challenges (id, code unique, type_id, age_group, position, title)` with `age_group` as a single enum value derived from the column band, and `challenge_goals (challenge_id, goal_id)` with composite PK. Challenge codes are `<type code>-<letter>` (for example `EVAS-A`), stable across regenerations. Challenge text keeps its `[Integração …]` markers as authored.

**D4. The dataset is a generated JSON file, the workbook stays out of the repo.**
`scripts/build-progress-matrix.ts <workbook.xlsx>` writes `drizzle/seeds/data/progress-matrix.json` (areas, general objectives, goals with age groups, types, challenges with `goal_codes`) in a fixed order with stable formatting so regeneration is byte-identical. It reuses the code grammar above, resolves every link, and exits non-zero naming the type, column and code on any miss. The JSON is the source of truth at runtime; nobody needs the workbook to create an environment. A unit test pins the totals (6 / 40 / 174 / 7 / 112 / 286).
*Alternative:* parse the workbook at deploy time. Rejected: deploys would depend on an external file.

**D5. One loader, called from every environment-creation path.**
`src/lib/reference-data/progress-matrix.ts` exposes `applyProgressMatrix(executor, dataset)`: in one transaction it upserts by `code` in dependency order (areas → general objectives → goals + age groups → types → challenges → links), then retires placeholders. Link rows are replaced per challenge and goal so removed links disappear. Entrypoints:

- `drizzle/seeds/index.ts` (`db:seed`) replaces `seedEducationalAreas()` with it.
- `scripts/ensure-hosted-db.mjs` runs `tsx scripts/load-reference-data.ts` after `drizzle-kit migrate` **every** deploy, not only when the catalogue is empty.
- `tests/e2e/global-setup.ts` calls it for `scout_toolkit_e2e`.
- Integration tests call `applyProgressMatrix` with a small fixture dataset through a test helper, so they stay fast and independent of the real data.

*Alternative:* put the data in a migration. Rejected: a data correction would then need a new migration, and test/e2e DBs use hand-written schemas.

**D6. Managed rows.**
Areas, general objectives, goals, types and challenges get `is_managed boolean not null default false`; the loader sets it `true` on rows it writes and only ever updates or deletes rows it owns. The admin API answers 409 for update or delete of a managed row; the admin page shows them read-only. Admin-created goals keep `false` and are never touched. This is what lets the loader safely overwrite text when the Matriz changes.

**D7. Placeholder retirement lives in the loader, by code list.**
The 5 placeholder area codes and 15 goal codes from the old seed (`SOCIAL`, `SOCIAL_COMM`, …) are listed in the loader. Deleting them cascades to `activity_educational_goals`. The loader logs how many links it removed. No deletion happens in the migration, so the order of migration and loader on an environment does not matter.

**D8. The age-match rule is checked on the server, before writing.**
A `verifyActivityGoals(goalIds, ageGroups)` helper next to `verifyActivityTypes` runs one query over `educational_goal_age_groups` and returns the goals with no overlap. It is called by the admin and user create/update routes, and the Portuguese error names the goal codes. Goals with no age-group rows (legacy admin-created ones) never match, so they cannot be newly linked until an admin gives them age groups. The editor mirrors the rule on the client for UX only.

**D9. Read API.**
`GET /api/taxonomies/educational-goals` returns `{id, code, title, description, area, general_objective, age_groups}` and accepts repeated `age_group` and `general_objective_id` filters. `educational-areas` also returns general objectives, so the editor can group without extra calls. Activity payloads embed a leaner goal, `{id, code, title, age_groups}` (typed as `ApiEducationalGoal`), which is all the pills need; the activity detail adds `area` and a separate per-division `objectives` list (code, title, age group, observable behaviour, general objective) from `rich-activity-details`. The full shape with `general_objective` and `description` (`ApiTaxonomyGoal`) is only returned by the taxonomy endpoint. The catalogue `educational_goal` filter keeps its OR semantics.

**D10. Pill component and colour tokens.**
One `ObjectivePill` component (code, truncated title, `aria-label` and `title` with the age-group name) takes the activity's age groups and renders one pill per matching age group (D-rule in the `activity-objectives` spec). The colours are the division tokens defined by `brand-design-system` (Alcateia yellow, Tribo de Escoteiros dark green, Tribo de Exploradores dark blue, Clã red, each with its own label colour); the pill is built on that change's `DivisionPill`. Chefia has a token too but no objectives, so objective pills never use it.

**D11. Local dev data.**
After the loader runs, the 15 existing local activities have lost their placeholder links. A one-off, ask-before-running local script re-links them to Matriz objectives and makes at least four activities multi-valued: two group sizes, two age groups, and two to four age-matched objectives. `demo-activities.ts` is rewritten with the same shape so new environments get the same demo data. The script refuses a non-local `DATABASE_URL`, like the baseline loader.

**D12. Educational paths get their own table.**
`educational_paths (id, area_id, code, name, position, is_managed)` with 20 rows, and `general_objectives.path_id` (nullable like the other new FKs). The editor groups objectives area → path → general objective, which keeps a 174-item picker navigable. The paths do not appear in the workbook, so the generator carries them as a small, reviewed constant transcribed from Anexo 1 and a test checks that every general objective is assigned.
*Alternative:* a text column on general objectives. Rejected: the grouping order and names would be repeated 40 times.

**D13. Source precedence and a reconciliation report.** (Implementation note: the Regulamento PDF has a two-column layout, so its text cannot be extracted reliably enough to overwrite workbook text; the generator reads codes and the first words of each objective and reports every difference, and the dataset keeps the workbook text until a person decides each flagged item.)
The Regulamento is the regulation in force, so its codes and text win; the workbook is the only source of *desafios* and their links, so those come from it. The generator reads the Regulamento PDF text (placed under the git-ignored `data/`), normalises codes, diffs every objective against the workbook, and writes `drizzle/seeds/data/progress-matrix.report.json` listing differences, one-sided codes and links to codes the Regulamento lacks. Verbatim repeats of another objective's text (the `4A.2` case) keep the workbook text and are flagged. A person from the Matriz team decides each flagged item; the generator never decides silently.
**Decided (2026-11-09): the workbook, as carried by the team's reference sheet, wins.** The sheet's objectives tab has exactly the workbook's codes and texts, and the team declared the sheet the definitive reference (see `reference-sheet-alignment`). The differences with the Regulamento stay known and unchanged in the dataset: `2C.3-4`, `4F.2.3` / `4F.2.4`, `6C.2` / `6C.3`, `7C.3-4`, and the workbook wording of `4A.2` and `4I.2`. The generator's report keeps listing them for information; none is an open item.
*Alternative:* trust the workbook alone. Rejected: it is older and has already been found to differ.

## Risks / Trade-offs

- **47 of 112 *desafios* link objectives from more than one stage** (for example an Escoteiros-band *desafio* that also lists a Clã objective) → stored exactly as in the Matriz; nothing in this change uses *desafio* links for matching. A report counts them so the owners of the Matriz can confirm.
- **Pills depend on another change** → the division tokens and `DivisionPill` come from `brand-design-system` and are in place; objectives with no matching division (legacy, admin-created) fall back to a neutral pill.
- **The two sources disagree in places** → the reconciliation report (D13) makes each difference visible; the product owner or the Matriz team settles flagged items before the dataset is committed.
- **Area names are confirmed** (and match the Regulamento), so no longer a risk; names live in the generator's mapping.
- **Removing placeholder links on Preview/Production** → deliberate, logged with counts; run on Preview before Production. If real activities were curated against placeholders there, they lose those links.
- **Overwriting on every deploy** → admin edits to managed rows are impossible by design (409), so nothing is silently lost.
- **Breaking API shape for goals** → all consumers (hooks, components, exports, tests, swagger) change in the same task group; the old `code` values do not survive.
- **Wider activity picker** → 174 objectives are many; the editor shows only the selected age groups' objectives, grouped by area and general objective, with search.

## Migration Plan

1. Edit `drizzle/schema/taxonomies.ts` (+ new tables), then `npm run db:generate` (ask first), review the SQL and commit it. The migration only adds tables and columns; it deletes nothing.
2. Local: after approval, run `db:migrate`, then the reference loader, then the local re-link script. Check counts (6 / 40 / 174 / 7 / 112 / 286) and that every local activity still opens.
3. Preview deploy applies the migration and the loader; verify, then Production.
4. Rollback: the new tables and columns are additive, so an old build keeps working; the removed placeholder goals are not restored (re-run the old seed if needed).

## Open Questions

- Do the owners of the Matriz want *desafio* links that cross stages kept as listed (current choice) or limited to the *desafio*'s own stage?
- Should a shared `3-4` objective on an activity for both Exploradores and Clã render as two pills (current choice) or a single two-tone pill?

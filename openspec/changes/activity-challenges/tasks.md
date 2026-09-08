## 1. Schema and seed

- [x] 1.1 Add `challenge_types`, `challenges`, and `activity_challenges` in Drizzle (unique type name; challenge `type_id` FK; junction PK + indexes) and generate the migration — verify `npm run db:generate` produces SQL for the three tables
- [x] 1.2 Seed the seven challenge types, the ten named challenges (each of one type), and the demo-activity links in the spec — verify upsert by name, a second seed does not duplicate, and "Construção de Abrigo" has Completar 5 nós and Montar um abrigo simples

## 2. Taxonomies API

- [x] 2.1 Add public GET `/api/taxonomies/challenge-types` and `/api/taxonomies/challenges` (challenge includes type id and name) — verify a guest 200 and the payload shape
- [x] 2.2 Extend admin taxonomy POST/PATCH/DELETE for `challenge-types` and `challenges` (unique type name; unknown `type_id` 400/404; non-admin 403; delete 409 when a challenge or in-use type is linked) — verify SQL-integration on `scout_toolkit_test`

## 3. Activity read/write/filter

- [x] 3.1 Extend `parseActivityWrite` / `replaceRelations` with `challenge_ids` (unknown id → 400; empty list clears) — verify unit tests for replace, empty, and unknown id
- [x] 3.2 Include `challenges` on activity list and detail payloads and accept `challenges` query (any-of, same as educational goals) — verify SQL-integration list/detail/filter on `scout_toolkit_test`

## 4. Catalogue UI

- [x] 4.1 Show challenge badges next to objectives on the tile (max 3 + remainder) and table (max 2 + remainder); omit the block when empty — verify unit tests on ActivityCard and ActivitiesTable
- [x] 4.2 Add a detail challenges section immediately after objectives (name, description, type name); omit when empty — verify ActivityDetail unit tests
- [x] 4.3 Add a challenges checkbox multi-select in advanced filters (desktop + mobile sheet) with the same any-of + clear behaviour as objectives, plus pt/en chrome keys — verify ActivityFilters unit tests and Playwright on Chromium

## 5. Editor and admin taxonomies UI

- [x] 5.1 Add an educational-objectives multi-select and a challenges multi-select immediately after it on ActivityEditorForm (create/edit and leader propose); persist `challenge_ids` — verify admin create with one challenge in Playwright
- [x] 5.2 Add **Tipos de desafio** and **Desafios** tabs on `/admin/taxonomias` — verify Playwright: admin creates a type and a challenge, guest sees the challenge name in the activities filter list

## 6. Roadmap pointer

- [x] 6.1 Add Epic 18 in `docs/planning.md` pointing at this OpenSpec change (no duplicated task list) — verify the heading and path are present

## 1. Review and inputs

- [ ] 1.1 Review the UI proposal (`ui-proposal.html` and design D7) and decide the open UI questions (tabs versus stacked divisions, card risk badge).
- [ ] 1.2 Decide the open content questions in the proposal: risk mandatory or optional, range levels, *desafios* across divisions, licence handling.
- [x] 1.3 Confirm `progress-matrix-objectives` is applied (this change builds on its tables, `DivisionPill` and `ObjectivePill`).

## 2. Schema and migration

- [x] 2.1 `drizzle/schema/activities.ts`: add the six risk columns and `source_id`, `source_url` to `activities`; add `justification` to `activity_sdgs`; add `age_group` and `observable_behaviour` to `activity_educational_goals` and change its primary key to (activity, goal, age_group); add `activity_challenges`.
- [x] 2.2 `drizzle/schema/taxonomies.ts`: add `activity_sources` (code, name, url, license, access, language, is_managed).
- [x] 2.3 **Ask first**, then `npm run db:generate`. Review the SQL: additive, plus the primary-key change with a backfill (one row per existing link × shared activity division). Commit it with snapshot and journal.
- [x] 2.4 Mirror the new columns and tables in `tests/setup.ts` and its truncation list.

## 3. Reference data: sources

- [x] 3.1 Add the `fontes` tab as a committed dataset `drizzle/seeds/data/activity-sources.json` (metadata only: names, links, licence text) and load it from the reference loader (same idempotent, managed-row rules as the Matriz).
- [x] 3.2 Unit and integration tests: first load, second load changes nothing.

## 4. API and validation

- [x] 4.1 Parse and validate the new payload fields in `src/lib/activities/write.ts` with Zod: risk levels and lengths, `objectives`, `sdgs`, `challenge_ids`, `source_id`, `source_url` (HTTPS); keep `educational_goal_ids` and `sdg_ids` as shorthands.
- [x] 4.2 Replace `verifyActivityGoals` with a per-row check: the objective belongs to the row's division (`leaders` rows reference `rovers`), and the division is one of the activity's. Return the Portuguese 400 naming the codes.
- [x] 4.3 `replaceRelations`/`updateActivity` write the new rows; read payloads (`/api/activities/[id]`, list) return risks, objective rows with behaviours, SDGs with justifications, *desafios*, source.
- [x] 4.4 New read endpoints `GET /api/taxonomies/activity-sources` and `/api/taxonomies/challenges` (grouped by type); classify them in `FEATURE_ROUTES` and update the swagger config, types and guards.
- [ ] 4.5 Edit suggestions: decide which new fields can be suggested (at least risks, mitigations, behaviours).
- [x] 4.6 Integration tests for every scenario in the new specs (valid, invalid level, objective of another division, leaders referencing rovers, old payload shorthands, unknown *desafio*).

## 5. Detail page

- [x] 5.1 `parseInstructions` in `src/lib/activities/instructions.ts` with unit tests (structured, plain, mixed, accents and case, steps with multi-line text).
- [x] 5.2 `RiskCards` component (level badge with text and bars, risk, mitigation, "not available" states) and tests, including the dark theme and contrast pairs for the three levels (add pairs to `src/lib/design/tokens.ts`).
- [x] 5.3 `DivisionObjectives` (tabs of `DivisionPill`s, objective rows with behaviours, leaders note) and tests.
- [x] 5.4 `SdgJustifications` and `ChallengeList` components and tests.
- [x] 5.5 Rebuild `ActivityDetail` in the reading order of the specs: header with facts, actions and source, a single reading column (no side column), two risk cards side by side from 1024 px, collapsible secondary sections on phones, safety always open.
- [x] 5.6 Update strings in `src/messages/pt.json` and `en.json`.
- [ ] 5.7 Manual pass at 1440 px and 390 px, light and dark, with the sample activity and with a sparse one.

## 6. Editor

- [x] 6.1 Restructure `ActivityEditorForm` into steps (basics and source, instructions with template, safety, divisions and objectives, SDGs, *desafios* and image) with only the existing required fields still required.
- [x] 6.2 Per-division objective blocks with behaviour textareas, reusing `ObjectivePicker`; `leaders` picks from rovers' objectives; deselecting a division removes its rows with a message.
- [x] 6.3 Per-SDG justification textareas; *desafio* picker grouped by type.
- [x] 6.4 Admin list: "análise de risco em falta" marker.
- [ ] 6.5 Component tests for each step and an E2E case (create an activity with two divisions, a risk analysis and a behaviour; see it on the detail page).

## 7. Import mapping

- [x] 7.1 Extend `baseline-map.ts` and `baseline-plan.ts` with parsers for risk cells, objective and behaviour blocks, SDG lines, *desafio* lines, source columns; unit tests with synthetic cells shaped like the sample (no real sheet text committed).
- [x] 7.2 Extend `baseline-db.ts` to insert the new relations; extend the report with the unmapped values.
- [ ] 7.3 Revise `baseline-activity-load` and `admin-activity-excel-import` artifacts to point at this mapping.
- [x] 7.4 **Ask first**: dry-run the loader on the real sheet export, review the report, then load into the local dev database only.

## 8. Exports and cards

- [x] 8.1 Excel and PDF exports include risks with mitigations, objectives per division with behaviours, SDG justifications, *desafios* and source.
- [x] 8.2 `ActivityCard` and program entry views: show objective pills per row (already per division) and, if decided in 1.1, a risk badge.

## 9. Wrap-up

- [ ] 9.1 Update `docs/api.md`, `docs/architecture.md`, `docs/planning.md` and the design-system document for the new components.
- [ ] 9.2 `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run test:e2e`.
- [ ] 9.3 `openspec validate rich-activity-details --strict`; archive after `progress-matrix-objectives`.

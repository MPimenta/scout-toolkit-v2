## 1. Review and inputs

- [x] 1.1 Decisions taken: duration slider with fields, area as the first objective level, divisions as pills on cards, Formato/Foco grouping. Open and not blocking: per-value icons, table view pills.
- [x] 1.2 Confirm that `brand-design-system` and `progress-matrix-objectives` are applied; `activity-types-review` is needed only for the grouped types.

## 2. API

- [x] 2.1 `GET /api/activities`: accept comma-separated `educational_areas` and `general_objectives` next to `educational_goals` (OR across them, one row per activity), validate with Zod, keep `duration_min` and `duration_max` as inclusive bounds and ignore `duration_operator`; update `src/types/api.ts`, `component-schemas.ts`, guards and swagger.
- [x] 2.2 Integration tests: area, general objective, specific objective and their union; each activity once; duration bounds inclusive, one-sided, legacy operator ignored; invalid ids rejected.

## 3. Facts iconography

- [x] 3.1 Add `src/lib/design/icons.ts` (`FACT_ICONS`) and the `Fact` and `FactIcon` components with tests.
- [x] 3.2 Use them in `ActivityDetail`, `ActivityCard` (remove `TrendingUp`), `ActivitiesTable`, program entry views and the filter; add the scan test that fails on another icon for these facts.

- [x] 3.3 `ActivityCard`: replace the division text line and its icon with one `DivisionPill` per division (fixed order, compact labels from the new `ageGroupShort` locale keys, ages in the accessible name and title); component tests for one, several and all five divisions, and for the unchanged objective pills.
- [x] 3.4 `ActivitiesTable`: use the same division pills where divisions are shown (confirm during implementation review).

## 4. Filter sections

- [x] 4.1 Split `ActivityFilters` into section components sharing one state object; keep the existing props and `FilterState` (remove `durationOperator`).
- [x] 4.2 `DivisionToggle` (built on `DivisionPill`, inside the same file so the colour scan still passes), with selected and unselected states, `aria-pressed`, 44 px targets and tests including the contrast pairs for the swatch border.
- [x] 4.3 Fact sections (group, effort, location) with the shared icons and checkbox options.
- [x] 4.4 `DurationRange`: pure helpers (stops, nearest stop, readout, validation) with unit tests; the slider, the two fields, the keyboard behaviour and the inline error.
- [x] 4.5 Format and focus sections (replacing the types section, by ) with counts and descriptions, flat fallback; hide zero-count values.
- [x] 4.6 `ObjectiveFilterTree`: pure node-state functions (on, partial, off, select, deselect, clear below, drop objectives that no longer match the divisions) with unit tests; the tree UI with search, counts, chips and division-coloured leaves.
- [x] 4.7 Active-filter chips with the same icons and pills; the "Limpar" control.
- [x] 4.8 Phone sheet: same sections in one column, sticky search and actions, one open area at a time.
- [x] 4.9 Send the new parameters from `useActivities` and the page; remove the operator and its locale labels.

## 5. Strings and docs

- [x] 5.1 New keys in `src/messages/pt.json` and `en.json`; remove the unused operator keys.
- [x] 5.2 Update `docs/design-system.md` (division toggle, fact icons) and `docs/api.md`.

## 6. Verification

- [x] 6.1 Component tests for every section and an E2E case: choose a division pill, set a duration range, select an area, see the chips and the filtered list.
- [x] 6.2 Manual pass at 1440 px and 390 px, light and dark (Playwright screenshots; fixed the phone sheet bleed, 44 px close target and duplicate clear control).
- [x] 6.3 `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run test:e2e` all pass (79 passed, 32 skipped by design).
- [ ] 6.4 `openspec validate catalogue-filters-refresh --strict`; archive after `reference-sheet-alignment` (which replaced `activity-types-review`) and `progress-matrix-objectives`.

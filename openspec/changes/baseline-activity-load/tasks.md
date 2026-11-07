## 1. Inputs

- [x] 1.1 Export the `atividades` tab (and `ods`) to an untracked folder (`data/`), add it to `.gitignore`, and document the export steps in the script header
- [ ] 1.2 Confirm the open questions in `design.md` (collapse rules, committable sources) and update the artifacts if they change
  - Partly done: collapse rules dropped (lists now); still open: committable sources, and whether "Exploradores" = 10-14 section.

## 2. Mapping module

- [x] 2.1 Add `src/lib/activities/baseline-map.ts`: duration parser (number, range, `min`, `h`), list splitter with the documented collapse rules, SDG name to number, placeholder (`-`) handling, name normaliser
- [x] 2.2 Unit tests in `tests/unit/lib/` for each rule, using the sample cells observed in the sheet (`15-30`, `20/30 min`, `1h`, `-`, empty group, multi-division cell)

## 3. Loader script

- [x] 3.1 Add `scripts/load-baseline-activities.ts`: read CSV/XLSX, validate rows, apply selection (seeded, balanced by source and age group), duplicate check
- [x] 3.2 Add the DB host guard, `--dry-run`, `--replace` with the references check, and `--force`
- [x] 3.3 Write through `parseActivityWrite`/`createActivity`; map type names to existing `activity_types` and SDG numbers to existing `sdgs`; leave educational goals empty
- [x] 3.4 Produce the console summary and a JSON report (counts, fill rates, collapsed/dropped values, unmapped taxonomy values, skipped rows with reasons)
- [x] 3.5 Add an npm script entry (e.g. `db:load-baseline`) and document usage

## 4. Baseline fixture and tests

- [ ] 4.1 Generate a fixture from rows with open/public-domain sources only; commit it under `tests/fixtures/`
  - Not done: needs the sheet snapshot and your licence decision. A synthetic sample (`tests/fixtures/baseline-sample.csv`) covers the tests meanwhile.
- [x] 4.2 Integration test in `tests/integration/` that loads a small fixture into `scout_toolkit_test` and checks counts, normalised values and duplicate skipping
- [x] 4.3 Document how to load the full local snapshot into `scout_toolkit_test`

## 5. Run and review (needs your go-ahead each time: data change)

- [ ] 5.1 Dry run against the full snapshot and review the report with you
- [ ] 5.2 Load ~200 activities into the local dev database with `--replace`
- [ ] 5.3 Write up the findings: sheet fixes, schema questions, and a revised plan for `admin-activity-excel-import`

## 6. Verification

- [x] 6.1 `npm run lint`, `npm run typecheck`, `npm run test:run`
- [x] 6.2 `openspec validate baseline-activity-load`

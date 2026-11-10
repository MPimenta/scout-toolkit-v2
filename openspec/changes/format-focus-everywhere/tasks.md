## 1. Shared helper

- [ ] 1.1 Add `src/lib/activities/kind-label.ts` (`activityKindLabel`: format, focuses, former-type fallback) with unit tests for the three cases (format and focuses, type fallback, neither)
- [ ] 1.2 Move `ActivityDetail` onto the helper without changing what it shows

## 2. Catalogue and admin table

- [ ] 2.1 `ActivityCard`: label is the format, with the type fallback and no slot when neither — component test for the three cases
- [ ] 2.2 `ActivitiesTable`: replace the type column with Formato and Foco, update the CSV and the mobile row, keep sorting and search — component test
- [ ] 2.3 Add the new column and header strings to `pt.json` and `en.json` (Portuguese wording for approval)

## 3. Program builder

- [ ] 3.1 `GET /api/programs/[id]`: batch-load and return `format`, `focus`, `secondary_focus` per activity entry (no per-entry query), keep `activity_types`; update `useProgram` types, swagger and `docs/api.md`
- [ ] 3.2 `AddActivityModal`: replace the type select with format and focus selects built from the loaded activities, focus matching main or secondary — component test including the secondary-focus scenario
- [ ] 3.3 `ProgramScheduleRow` and `ProgramBuilder`: show `Formato · Foco · Foco secundário` using the helper — component test
- [ ] 3.4 E2E: in the program builder, filter the add-activity dialog by a format and a focus and add an activity (sheet activity, no former type)

## 4. Exports

- [ ] 4.1 `load-program.ts` and `types.ts`: load format, focus and secondary focus for each activity
- [ ] 4.2 `excel.ts` and `labels.ts`: Formato, Foco and Foco secundário replace Tipo de Atividade on both sheets, with the former types in Formato for an activity with no format — unit tests on the workbook cells
- [ ] 4.3 `pdf-html.ts`: the `Formato · Foco · Foco secundário` line under the activity name, HTML-escaped — unit test
- [ ] 4.4 Export a program with a sheet activity, an older activity with a type and a sparse activity: all three succeed

## 5. Edit suggestions

- [ ] 5.1 `fields.ts` and `index.ts`: add `format_id`, `focus_id`, `secondary_focus_id` (existence check, main focus differs from secondary), reject new `activity_types`, keep the apply path for pending ones — unit and SQL-integration tests
- [ ] 5.2 `SuggestEditForm`: format and focus selects instead of the type multi-select; admin suggestions list shows the names — component test
- [ ] 5.3 Swagger and `docs/api.md` for the new suggestable fields

## 6. Wrap-up

- [ ] 6.1 Search `src/` for remaining reads of `activity_types` / `activityTypes` and record which are intentional (fallback, API compatibility, types admin screen)
- [ ] 6.2 `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run test:e2e`
- [ ] 6.3 Check the Preview: card labels, the builder dialog, an Excel export and a suggestion on a sheet activity
- [ ] 6.4 `openspec validate format-focus-everywhere --strict`, then archive

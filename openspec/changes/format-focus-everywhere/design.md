## Context

After `reference-sheet-alignment`, an activity carries `format`, `focus` and `secondary_focus` (each `{ id, code, name }`), and the former `activity_types` list is empty for every sheet activity. Places that still read `activity_types` (found by searching `activity_types` / `activityTypes` in `src/`):

- `ActivityCard` (label), `ActivitiesTable` (column, CSV row, mobile row), `ActivityDetail` (already prefers format; type is the fallback).
- Program builder: `AddActivityModal` (type select built from the loaded activities), `ProgramScheduleRow`, `ProgramBuilder`, `useProgram`, `GET /api/programs/[id]`.
- Exports: `load-program.ts`, `types.ts`, `excel.ts` (two sheets), `labels.ts`.
- Edit suggestions: `SUGGESTABLE_FIELDS` and `CATEGORY_FIELDS` include `activity_types`; `index.ts` validates and applies it.

## Goals / Non-Goals

**Goals:**
- Wherever the type was shown or chosen, show or choose the format and focus, with the type only as a fallback for old activities.
- One helper so the label is the same everywhere.

**Non-Goals:**
- Removing the type tables, the admin types screen or the `activity_type` query parameter (a later cleanup change, after a deprecation check).
- Changing the format and focus themselves (managed by `reference-sheet-alignment`).

## Decisions

### One label helper
`activityKindLabel(activity)` in `src/lib/activities/kind-label.ts` returns `{ format, focuses[] , fallback }`: the format name, the main and secondary focus names, and, when there is no format, the former type names. Cards, the table, program rows and the exports call it. The detail page already shows `Format · Focus · Secondary` and moves onto the helper.

### Card shows the format, not the focus
The card has one label slot. It shows the format (the kind of activity); the focus is on the detail page and in the filters. This keeps the card as dense as today.

### Builder filters come from the loaded activities
`AddActivityModal` already builds its type list from the activities it holds. It will build format and focus lists the same way (names present in the list, with counts not needed), with "Todos" first. The focus filter matches the main or the secondary focus, as in the catalogue.

### Program API returns the values
`GET /api/programs/[id]` adds `format`, `focus` and `secondary_focus` to each entry's activity (batch-loaded like the categories, no per-entry query), keeping `activity_types` for older clients.

### Exports replace the type column
The Excel program sheet and the activity details sheet replace the "Tipo de Atividade" column with "Formato", "Foco" and "Foco secundário". An activity with no format shows its former types in the "Formato" cell, so old data is not lost. The PDF shows one line `Formato · Foco · Foco secundário` under the activity name when the activity has them.

### Suggestions: ids, not names
A suggestion for `format_id`, `focus_id` or `secondary_focus_id` stores the value id as text. Validation: the id exists in its table; the main focus must differ from the secondary focus of the activity (the one that would result); the main focus and the format cannot be cleared by a suggestion; the secondary focus can only be set to another value (clearing it is an edit for an admin). Accepting it updates the activity column. New `activity_types` suggestions answer 400; pending ones already stored stay resolvable, so nothing is stranded.

## Risks / Trade-offs

- An activity with neither format nor type shows no label: acceptable, as today.
- Excel consumers that read the old column by header lose it: the column names change; noted in the change log of `docs/api.md`.
- Existing pending `activity_types` suggestions need the old apply path kept until they are resolved: the code stays, only creation is closed.

## Open Questions

- Should the card also show the main focus as a second, lighter label? Default: no.
- Should the builder filter keep a free-text search next to the selects? Default: unchanged.

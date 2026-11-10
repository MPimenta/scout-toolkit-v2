## Why

`reference-sheet-alignment` replaced the activity types with a format and a focus, and changed the catalogue filters, the activity page and the editor. The former types are no longer valid, but the code, the API, the database and the admin screens still carry them, and many places still read them. The 1,080 activities from the sheet have a format and a focus but no type, so where the type is shown it shows nothing: the catalogue card has no label, the admin table column and the Excel "Tipo de Atividade" column are empty, the program builder's type filter has no options, program rows show a blank line, and an edit suggestion can only propose the old type. Keeping the type "as legacy" costs a second classification to maintain and explain. It should be removed, not kept.

## What Changes

- **Replace** every place that shows or chooses the type with the format and focus: catalogue card, admin table (and CSV), program builder dialog and rows, program API, Excel and PDF exports, edit suggestions.
- **Remove the type** from the whole product, with no fallback:
  - the API: `activity_types` in activity and program responses, the `activity_type` filter, `activity_type_ids` on writes, `GET /api/taxonomies/activity-types` and the `activity-types` admin taxonomy kind;
  - the admin: the types tab on the taxonomy screen;
  - the editor, the loaders, the seeds and the demo activities (which get a format and a focus directly);
  - the data: a committed migration drops `activity_types` and `activity_activity_types`, after rejecting any pending edit suggestion for `activity_types`;
  - types, validation schemas, query keys, strings, docs, tests and the main specs.
- **Shared helper** for the `Formato · Foco · Foco secundário` label so every place says the same thing.
- **Remove** the one-time `format-focus-backfill` (it maps types to formats and is not needed once the types are gone), after a final check that lists activities still without a format or a focus.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `activity-browsing`: the card label is the format.
- `activity-categories`: no activity-type category, filter or parameter.
- `program-builder`: the add-activity dialog and the schedule rows use format and focus.
- `program-export`: exports show format, focus and secondary focus.
- `admin-activities`: the admin table shows format and focus.
- `admin-taxonomies`: no activity-type management.
- `edit-suggestions`: format and focuses are suggestable; the type is gone.
- `feature-flags`: the public lists that stay available are formats, focuses, SDGs and goals.

## Impact

- **Schema:** one migration dropping two tables (destructive, ask before generating and applying; Preview applies it on deploy). The type data is obsolete: the old demo activities already have a format and a focus, and the original activities were merged into their sheet copies.
- **Code:** about 60 source files and 50 test files read the type; the full list is in the tasks. API clients that send `activity_type_ids` have it ignored; clients that read `activity_types` lose the field.
- **Breaking API change:** `GET /api/taxonomies/activity-types` disappears (404) and `activity_type` stops filtering. Noted in `docs/api.md`.
- **Copy:** new Portuguese column and filter labels need the user's approval.

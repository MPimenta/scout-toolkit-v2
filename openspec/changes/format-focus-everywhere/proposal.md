## Why

`reference-sheet-alignment` replaced the activity types with a format and a focus, and changed the catalogue filters, the activity page and the editor. Several other places still read the former types. The 1,080 activities loaded from the sheet have a format and a focus but no type, so in those places the type shows nothing: the catalogue card has no label, the admin table column and the Excel "Tipo de Atividade" column are empty, the add-activity dialog in the program builder has no type options, program rows show a blank line, and an edit suggestion can only propose the old type.

## What Changes

- **Catalogue card** shows the format as its label (the former type only as a fallback for an activity with no format).
- **Program builder:** the add-activity dialog filters by format and focus instead of type; program schedule rows and the program API show format and focus.
- **Exports:** the Excel program and activity sheets, and the PDF, show format, focus and secondary focus instead of the type.
- **Admin activities table** (columns, CSV and mobile row) shows format and focus.
- **Edit suggestions:** a user can suggest a format, a focus or a secondary focus; new suggestions of the former type are no longer accepted (pending ones can still be resolved).
- **Shared helper** that builds the "format · focus · secondary focus" label with the former-type fallback, so every place says the same thing.
- Not changed: the former type tables and the admin types screen stay until the types are removed in a later change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `activity-browsing`: the card label is the format.
- `program-builder`: the add-activity dialog and the schedule rows use format and focus.
- `program-export`: exports show format, focus and secondary focus.
- `admin-activities`: the admin table shows format and focus.
- `edit-suggestions`: format and focuses are suggestable; the former type is not.

## Impact

- Code: `ActivityCard`, `ActivitiesTable`, `AddActivityModal`, `ProgramScheduleRow`, `ProgramBuilder`, `src/app/api/programs/[id]/route.ts`, `src/lib/export/*`, `src/lib/suggestions/*`, `SuggestEditForm`, `useProgram` types, and the strings in `pt.json` / `en.json`.
- No schema change and no migration: format and focus columns already exist.
- Tests: unit tests for the helper, the exporters, the suggestion validation and the components; one E2E case in the program builder and one in the catalogue.
- Copy: new Portuguese strings (filter labels, column headers) need the user's approval.

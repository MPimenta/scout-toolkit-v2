## Why

Admins need to load many catalogue activities from a spreadsheet instead of creating them one by one. The file must carry every activity field, use the same constrained values as the product, and skip rows that already exist so a re-import does not duplicate the catalogue.

## What Changes

- Add an admin Excel import on the activities admin screen (upload `.xlsx`, report created / skipped / invalid)
- Skip repeats: same normalised name + same age group already in the catalogue or earlier in the file
- Accept the published column layout (Portuguese headers; enum keys or Portuguese labels; goal codes and SDG numbers)
- Ship a fill-in template with a values sheet (this change includes that file)
- Imported rows become approved catalogue activities unless the row says otherwise
- Do **not** invent taxonomies from the sheet; unknown type, goal, or SDG fails that row

## Capabilities

### New Capabilities

- `activity-import`: Admin Excel import of catalogue activities with duplicate detection and a fixed column template

### Modified Capabilities

- (none)

## Impact

- Admin UI: import control next to Nova atividade; downloadable template
- API: admin-only multipart/JSON import under `/api/admin/activities`
- Reuse `createActivity` / `parseActivityWrite` mapping; `xlsx` is already a dependency
- Tests: unit parse + SQL-integration on `scout_toolkit_test` + Playwright as admin
- Unchanged: public catalogue, edit suggestions, one-by-one admin CRUD

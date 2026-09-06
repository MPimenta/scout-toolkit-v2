## Why

Leaders can already mark a program `is_public`, but `/programas` and `GET /api/programs` only list the owner's own programs. A public flag with no gallery cannot spread good session plans across agrupamentos.

## What Changes

- Add a public gallery that guests and signed-in users can browse without owning the program
- Show a read-only preview of a public program (schedule, duration, author name, date)
- Search by name and filter by date presence, duration band, and sort
- Keep private programs invisible to everyone except the owner
- Do **not** copy or clone here (that is `program-use-as-template`)

## Capabilities

### New Capabilities

- `public-programs`: Browse, search, filter, and preview programs whose `is_public` is true

### Modified Capabilities

- (none)

## Impact

- API: public list/detail routes that do not require ownership (guest GET allowed)
- UI: gallery page + preview; header/nav link in Portuguese
- Reuse existing `is_public` column and `idx_programs_public`; no schema change in this story
- Tests: unit/integration for visibility rules; E2E browse + preview
- Roadmap: `docs/planning.md` Story 8.1

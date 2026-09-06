## Why

The app is a desktop-first responsive pass: header hamburger and one-column cards exist, but filters, tables, the program builder, rating chrome, and the lockup + Sign-in + menu cluster are cramped on a phone. Leaders use this in the field. This is Epic 11 (new); former Epics 11–13 shift to 12–14.

## What Changes

- Treat `< md` (768px) as the phone layout: usable without horizontal scroll or hover-only actions
- Shell: shrink the AEP lockup, keep Sign-in usable, hamburger with full nav (including admin when relevant)
- Catalogue: filters in a sheet; table view becomes cards on phone; activity detail and ratings stack
- Programs: list and preview stay one column; builder uses a vertical list with move-up/down (DnD optional)
- New Epic 8–10 pages must use the same shell rules (do not ship a second desktop-only admin)
- Not a native app, not a new visual language, no new brand colours

## Capabilities

### New Capabilities

- `mobile-layout`: Phone-usable shell, catalogue, activity page, and program builder at `< md`

### Modified Capabilities

- (none — layout constraints; existing capability requirements stay)

## Impact

- UI: Header, Footer, ActivityFilters, ActivitiesTable, ActivityDetail, ActivityRating, ProgramBuilder, dialogs, future `/admin` and public gallery
- Tests: Playwright Mobile Chrome / Mobile Safari projects already in config
- Roadmap: `docs/planning.md` Epic 11 (stories 11.1–11.3); old 11–13 become 12–14

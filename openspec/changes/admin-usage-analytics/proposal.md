## Why

`usage-tracking` now records searches, activity views and additions to programs, but nobody can read them. Admins need to see which activities are looked at versus actually used in programs, what leaders search for (per division), and what they search for without finding anything, so the catalogue can be improved.

## What Changes

- New admin page `/admin/utilizacao` ("Utilização") with a period selector (7, 30, 90 days, 13 months) and a division selector.
- Totals for the period: searches, activity views, additions to programs, distinct visitors and distinct signed-in users.
- Daily evolution of the three event types.
- Top activities viewed and top activities added to programs, each showing views, additions and the conversion between them.
- Top searches (text, how many times, average number of results), searches by division, and searches with no results.
- Most active signed-in users, shown by name.
- New admin-only API `GET /api/admin/usage/summary` feeding the page; no raw-event endpoint.
- Admin dashboard gets a link to the page. Everything is behind the `usage-tracking` flag.
- Out of scope: Excel/CSV export, per-user drill-down, alerts, charts library, editing or deleting events.

## Capabilities

### New Capabilities
- `admin-usage-analytics`: what admins can see about usage, the filters, the access rule and how figures are computed.

### Modified Capabilities

## Impact

- API: `GET /api/admin/usage/summary` (admin only, flag `usage-tracking`).
- UI: page `/admin/utilizacao`, link on `/admin`, Portuguese and English strings.
- Code: query module `src/lib/usage/analytics.ts` reading `usage_events` (added by `usage-tracking`), joined to activities, age groups and users.
- Config: `FEATURE_ROUTES` entries for `/admin/utilizacao` and `/api/admin/usage`.
- Depends on `usage-tracking` being applied; no schema change.

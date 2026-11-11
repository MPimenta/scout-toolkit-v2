## Context

`usage_events` (from `usage-tracking`) holds `search`, `activity_view` and `program_add` rows with `visitor_id`, optional `user_id`, `activity_id` and a `payload` (search text, filters, divisions, result count). Admin pages live under `/admin/*` with a layout that checks the effective role; admin APIs use `requireAdminApi()`.

## Goals / Non-Goals

**Goals:** answer "what is viewed versus used", "what is searched per division", "what is searched without results" with simple, fast queries. **Non-Goals:** exports, a charting library, user drill-downs, real-time updates.

## Decisions

### One summary endpoint
`GET /api/admin/usage/summary?period=7d|30d|90d|13m&division=<age group>` returns everything the page needs in one response, computed by `src/lib/usage/analytics.ts` with a few grouped SQL queries run in parallel. The data volume (13 months of a small audience) does not justify caching or pre-aggregation; the existing indexes on `(type, occurred_at)` and `(activity_id, type, occurred_at)` cover the queries. Rejected: raw event list endpoint (more privacy exposure, no need).

### Division semantics
- Search events: `payload->'divisions' ? :division`.
- View and addition events: the activity belongs to the division (`activity_age_groups`).
- Totals, daily series and users use the same rule per event type.
- "Searches per division" expands `payload->'divisions'` (one count per division the search filtered by) and counts searches with none as `sem_divisao`. With a division chosen the chart still shows all divisions of the matching searches.

### Search text
Normalised with `lower(trim(text))` in SQL; empty text excluded from the text lists. Average results is the mean of `result_count`; the no-results list counts searches with `result_count = 0`.

### Calendar days
Series use `date_trunc('day', occurred_at at time zone 'Europe/Lisbon')`; the server fills missing days with zero so the page does not need to.

### Users
Joined to `user` for the name only. Limit 10, ordered by total events. Anonymous events are only in totals. E-mail is never selected.

### Page
Client page under the admin layout (so the role check is shared), period and division as segmented controls with `aria-pressed`, tables for lists and CSS bars (width proportional to the maximum, brand tokens only) for the series and the per-division counts. A short note states that figures are indicative. Loading, error and empty states in Portuguese.

### Access and flag
`requireAdminApi()` on the endpoint (so "view as member" is blocked too); `/admin/utilizacao` and `/api/admin/usage` are listed under the `usage-tracking` flag in `FEATURE_ROUTES`.

## Risks / Trade-offs

- **Misleading numbers** (bots, opt-outs, shared devices): stated on the page; no per-person conclusions beyond names of signed-in users.
- **Query cost** as data grows: bounded by 13-month retention; revisit with materialised daily counts if needed.
- **Names visible**: admin-only, matching the privacy page.

## Migration Plan

No schema change. Deploy with `usage-tracking`; nothing to migrate.

## Open Questions

- Do admins want an Excel export of the lists? Left for a follow-up.

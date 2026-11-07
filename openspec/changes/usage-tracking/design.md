## Context

The catalogue is public and the product has no analytics. Auth.js v5 handles sign-in; the app uses Drizzle/Postgres, Zod and feature flags (`src/lib/features.ts`). The footer links to `/privacy`, but no such page exists yet. Program entries are created in `POST /api/programs/[id]/entries`; activity detail is rendered by `ActivityDetail`; the catalogue calls `GET /api/activities` through `useActivities`.

## Goals / Non-Goals

**Goals:** record searches, views and program additions for guests and users; keep it minimal and honest; make later analysis cheap; allow the whole module to be switched off.
**Non-Goals:** the dashboard (follow-up `admin-usage-analytics`), A/B testing, per-user history pages, session replay, any third-party analytics.

## Decisions

### Anonymous visitor id, not a login wall
A random UUID in a first-party `HttpOnly`, `SameSite=Lax`, `Secure` cookie (`visitor_id`, 13 months). Created by the events endpoint on the first recorded event, never by page load. No fingerprinting. Rejected: forcing login (loses shared-link visitors and public discovery) and IP hashing (still personal data, adds nothing).

### Where each event is recorded
- `search`: **client-triggered**, sent to `POST /api/usage/events` once the results of a settled search arrive (debounced, only when text or any filter is set, skipping page changes and sorting). It is not recorded inside `GET /api/activities`, because that endpoint is also used by exports, the program picker and tests, and would count them as searches.
- `activity_view`: **client-triggered** once on mount of the detail page, de-duplicated per visitor and activity for 30 minutes (checked in the database by the latest event, so it survives reloads).
- `program_add`: **server-side** inside the entries route after a successful insert, so it cannot be forged and always matches reality. The events endpoint rejects this type.

### Schema
One table, `usage_events`: `id uuid`, `type text` (`search | activity_view | program_add`), `occurred_at timestamptz default now()`, `visitor_id uuid not null`, `user_id uuid null references user(id) on delete set null`, `activity_id uuid null references activities(id) on delete cascade`, `program_id uuid null references programs(id) on delete set null`, `payload jsonb` (search: `text`, `filters`, `divisions`, `result_count`). Indexes: `(type, occurred_at)`, `(activity_id, type, occurred_at)`, `(visitor_id, occurred_at)`, `(user_id, occurred_at)`. The migration is generated and reviewed in the usual way; no `db:push`.
Deleting a user sets `user_id` to null (events become anonymous) rather than deleting statistics.

### Linking visitor to user
On sign-in (Auth.js `signIn` event) and on the first recorded event after sign-in, the server runs `update usage_events set user_id = :user where visitor_id = :visitor and user_id is null`. Events from a shared device may therefore be attributed to the first user who signs in; this is accepted and stated on the privacy page. Admins see the user name through a join on `user`; names are never copied into events.

### Filtering and signals
A server helper `shouldRecord(request)` rejects requests with a bot or headless user-agent pattern (matched in memory and never stored), `Sec-GPC: 1`, `DNT: 1`, or the opt-out cookie `tracking_off=1`. When it rejects, no cookie is set. Rate limit: 60 events per visitor per minute, in memory per instance; it is an abuse guard, not a quota.

### Flag, routes and failure behaviour
New flag `usage-tracking`; `/api/usage` (events, purge and opt-out) is listed in `FEATURE_ROUTES`. Hooks check `useFeature('usage-tracking')`. Recording is fire-and-forget (`fetch` with `keepalive`); server writes are wrapped so a failure is logged with the existing logger and never reaches the visitor.

### Retention
`GET /api/usage/purge` (needs `Authorization: Bearer $CRON_SECRET`, which is what Vercel cron sends; scheduled daily in `vercel.json`) and the same function exported for a script. It deletes `occurred_at < now() - interval '13 months'` in batches and logs the count. Idempotent.

### Opt-out
`POST /api/usage/opt-out` sets the `tracking_off` cookie and removes `visitor_id`; `DELETE` turns recording back on. The visitor cookie is not readable by scripts, so the privacy page keeps the control's state locally.

### Reading
No public read API. Admin queries belong to the follow-up change; this change only adds what its own tests need to verify what was stored.

### Privacy page
`/privacy` is a static server page with Portuguese copy and `en.json` chrome; its tracking section is chosen by the flag. The legal basis (legitimate interest for aggregated statistics) and the contact for data requests are placeholders to be confirmed with the AEP data-protection contact before the flag is enabled in Production.

## Risks / Trade-offs

- **Shared devices** attribute earlier anonymous events to the next user to sign in. Mitigation: documented on the privacy page; used in aggregate by default.
- **Under-counting** from blockers, privacy signals and bot filtering. Accepted: figures are indicative.
- **Search noise** (partial words, retries). Mitigation: settle delay of 800 ms and no recording of identical consecutive searches.
- **Legal**: legitimate interest and names visible to admins need confirmation. Mitigation: the flag stays off in Production until confirmed.
- **Table growth**: bounded by the 13-month purge and compact payloads.

## Migration Plan

1. Migration adds `usage_events`; the flag is off by default.
2. Deploy; enable on Preview first, check events and the purge.
3. Confirm the privacy wording with the AEP, then enable in Production.
Rollback: switch the flag off; data stays until purged.

## Open Questions

- Who is the AEP data-protection contact for the privacy page?
- Should an admin be able to delete a user's events on request? Assumed yes, through a script; no UI in this change.

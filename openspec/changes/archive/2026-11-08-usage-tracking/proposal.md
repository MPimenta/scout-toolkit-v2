## Why

Today nobody can tell how the catalogue is used: which searches leaders run, which activities they open, and which end up in a program. Without that, gaps in the catalogue and the most useful activities stay invisible. The catalogue is deliberately public, so the answer is a tracking module that works for guests and signed-in leaders alike, not a login wall.

## What Changes

- New server-side usage tracking with three event types: `search` (text, filters, divisions filtered, result count), `activity_view` (activity detail opened) and `program_add` (activity added to a program).
- Each event carries a timestamp, an anonymous visitor id (first-party cookie, no third-party tracking) and, when signed in, the user id. The user name is read from the user record when an admin looks at the data.
- On sign-in the visitor id is linked to the user, so earlier anonymous events in that browser can be attributed.
- No IP address, user-agent or other fingerprint is stored. Known bots are not recorded.
- Events are sent to a server endpoint that validates them with Zod; `program_add` is recorded by the server when the entry is created, so it cannot be forged by the client.
- The module is behind a feature flag (`usage-tracking`). When off, nothing is recorded and the endpoint answers 404.
- Events are kept 13 months and then purged by a scheduled job.
- A new `/privacy` page (the footer already links to it, but the page does not exist yet) explains what is recorded, why, for how long and who can see it.
- The catalogue stays public. No login is required to browse, search or open an activity.
- Out of scope: the admin dashboard (follow-up change `admin-usage-analytics`), user-facing "my history", exports of raw events.

## Capabilities

### New Capabilities
- `usage-tracking`: which events are recorded, what each carries, what is never stored, visitor identity and linking on sign-in, bot filtering, the feature flag, retention and purge, who may read events.
- `privacy-notice`: a public privacy page that states what the product records and why, kept in step with the tracking behaviour.

### Modified Capabilities

## Impact

- Database: new `usage_events` table (committed Drizzle migration), indexes for the later analytics queries.
- API: new `POST /api/usage/events` (search and activity_view), `POST`/`DELETE /api/usage/opt-out` and `GET /api/usage/purge` (cron); server-side recording in `POST /api/programs/[id]/entries` (program_add) and in the sign-in flow (link visitor to user). `GET /api/activities` does not record anything (see design).
- Client: small `useTrackSearch` and `useTrackActivityView` hooks in the catalogue and detail page; no third-party scripts.
- Config: `usage-tracking` flag in `src/lib/features.ts` with `FEATURE_ROUTES` entries; new `/privacy` page and Portuguese/English strings.
- Docs: `docs/api.md`; privacy wording to be confirmed with the AEP data-protection contact before the flag is turned on in Production.

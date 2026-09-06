## Context

See proposal.md. Auth today is Orgo OAuth with scopes `profile email` only (`src/lib/auth/orgo-provider.ts`). That cannot create events. Orgo create uses an admin `Api-Token` with at least `HR_LOCAL`, header `Api-Token`, host `{tenant}/api/v1/events`. Kit programs have `name`, optional `date`, `start_time`, `is_public`, and entries — not location, end datetime, or Orgo unit IRI. Ticketing is out of this change.

## Goals / Non-Goals

**Goals:**

- Map what we can; dialog for end datetime, location, unit, optional capacity, publish
- Unit options = units the signed-in user may create events for
- Persist the Orgo uuid so the UI becomes a link
- Always send `hasEventTicketing: false`

**Non-Goals:**

- Timezone picker (use the user's zone)
- Ticket products, price, attendee registration, Stripe, webhooks
- Per-user OAuth write scopes (not granted today)
- Syncing Orgo edits back into the program
- Creating Orgo events from a single catalogue activity

## Decisions

1. **App-wide write token, not the login token**  
   `ORGO_API_TOKEN` on the server. The session authorizes *who* may click (owner or admin) and *which* units are listed.  
   Alternative: store each user's Orgo token. Rejected: OAuth has no event-write scope; a personal API token in the browser is worse.

2. **Create the program as one Orgo Event**  
   Description can list entry titles. Agenda rows in Orgo are out of scope.  
   Alternative: one Orgo event per activity row. Rejected: the user asked from the program details page.

3. **Unit picker from the user's event-create rights**  
   Server identifies the Orgo user (OAuth `sub` or email match), then reads their assignments (`GET /api/v1/user_roles?user=…` with the write token) and keeps units where that user may create events (EVENT / ADMIN grants, plus the tenant's "Who can create (Events)" floor — see [Orgo permissions](https://orgo.space/docs/platform/permissions)). The dialog is a select of those names; the POST body uses the unit IRI. Reject a unit not on that list.  
   Alternative: pasteable IRI or `ORGO_DEFAULT_UNIT`. Rejected: the owner must pick from their own units.

4. **Timezone is the user's environment**  
   Client sends `Intl.DateTimeFormat().resolvedOptions().timeZone` with the create. Server writes Orgo `timezone` and combines `date` + times in that zone. No dialog field. If the client omits it, assume `Europe/Lisbon`.  
   Alternative: default Lisbon in the UI and let them change it. Rejected: the user asked to assume their timezone.

5. **Start/end datetimes**  
   `dateTimeBegin` = `date` + `start_time` in the user's timezone. `dateTimeEnd` is required in the dialog; default to last entry `end_time` on that date, or start + 1 hour if there are no entries. The owner can edit the end.

6. **Ticketing always off**  
   Payload always `hasEventTicketing: false`. No price field, no `POST /api/v1/products`. Publish stays an optional dialog checkbox (`PATCH /api/v1/events_publish/{uuid}` after create).

7. **Idempotency via stored uuid**  
   Columns on `programs` (e.g. `orgo_event_uuid`, `orgo_event_url`). No second POST if uuid is set.

8. **Tests never call live eaep.escoteiros.pt**  
   Unit tests mock fetch (create + user_roles). SQL-integration may insert the uuid on `scout_toolkit_test` only.

## Risks / Trade-offs

- [Risk] Shared token creates events as the token owner, not the leader → Mitigation: put the leader's name in the description; document that Orgo audit shows the token owner.
- [Risk] Token can write to units the user cannot → Mitigation: only offer and accept units from the user's event-create list.
- [Risk] Cannot resolve the Orgo user from email/`sub` → Mitigation: empty unit list + Portuguese explanation; no create.
- [Risk] Browser timezone disagrees with the program date → Mitigation: still use the user's zone; they can fix end datetime in the dialog.
- [Risk] Token leak → Mitigation: server-only env; never send to the client; 503 if unset.

## Migration Plan

Drizzle column add. Rollback: hide the button and drop the columns.

## Open Questions

None that block review. Exact Orgo permission names used to filter the unit list are an apply-time detail under decision 3 (tests mock the filtered list).

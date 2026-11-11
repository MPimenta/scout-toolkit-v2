## Context

See proposal.md for why, and `docs/orgo-api.md` for what the Orgo API was found to offer (explored on the AEP tenant, limited to local center 3200). What exists (read for this design):

- `src/lib/orgo/client.ts` talks to `{ORGO_ISSUER}/api/v1` with an `Api-Token` header: it finds the user by exact email, reads `user_roles` to derive the units where the role starts with `EVENT_` or `ADMIN_`, creates events (`POST /api/v1/events`) and publishes them (`PATCH /api/v1/events_publish/<uuid>`). `map-event.ts` builds the payload (one-line description, `status: DRAFT`, ticketing off). `claim.ts` stores the event uuid on the program and prevents double creation. `CreateOrgoEventDialog.tsx` is the current dialog; `src/app/api/programs/[id]/orgo/route.ts` is the endpoint; `isE2EOrgoStub` provides a stub for e2e users.
- The program has blocks (`program_entries` with times, custom title, optional activity) and the PDF export exists (`program-export`, Playwright PDF).
- Activity data needed for the description: the *desafios* linked to each activity (with short titles and the integration marker from `reference-sheet-alignment`), and the observable behaviours stored per activity, objective and division.

What Orgo turned out to offer, and what it means:

- **The write token acts as one admin user** (`ADMIN_TENANT`, every scope). Orgo never limits what a leader may do through the app, and every event is owned by that admin. The server decides what a leader may do.
- **Invitations need a published event** (`POST /event_attends` on a draft: 400 "Publish the event first"). Publishing a future event notifies the members of its unit.
- **The description is HTML**, filtered on display: lists, headings, bold, italic, underline, line breaks and links render; tables, colours and `<div>` do not; scripts are dropped.
- **Files** go up in three calls (signed upload, file to a public-read bucket, register on the event).
- **Members belong to the local center.** `GET /users?localCenter=<id>` lists them (searchable by name, first name and `cardId`). A user carries a `type` (Lobito, Explorador, Escoteiro, Caminheiro, Dirigente). Units form a tree under the local center: a *divisão* per type, and *patrulhas/bandos/equipas* under a divisão (`parent`), each with a `userType`. No unit exposes a member list, so the divisão of a member follows from the `type`; the patrulha is not available.
- **Event links** are `/event/<uuid>`; attendance is `/events/attend/<uuid>`; counts come from `GET /events/<uuid>/analytics`.

## Goals / Non-Goals

**Goals:**
- Hand the whole plan over to eAEP in one action, within the leader's rights.
- Keep minors' data out of the app.
- Degrade clearly: whatever Orgo cannot do, the dialog says so instead of failing late.

**Non-Goals:**
- No sync of later program edits, no editing or cancelling the Orgo event from the app.
- No ticketing, price or product creation.
- No copy of attendance or participants into the app's database.
- No patrulha-level selection until Orgo exposes who is in a patrulha.

## Decisions

**D1. Discovery is done and recorded.** `docs/orgo-api.md` holds the findings, the specs were revised to them, and the tasks keep only the remaining checks (1.5): a real-size PDF, a non-admin leader's scope, the "present" status after a check-in.

**D2. A thin capability report, not a probe.** The API shape is known, so the report is small: can the leader publish in this unit, can the server read the leader's scope, is the program public (attachment allowed). The dialog is built from it, and the e2e stub reports everything supported.

**D3. Options endpoint plus step-wise create.** `GET /api/programs/[id]/orgo/options?unit=…` returns, for the signed-in owner: the units, the publish right for the unit, the attachment rule, and the participant tree for the leader's scope. `POST` creates the event, then runs publish, invitations and attachment as separate steps, each recorded as done or failed. The browser never decides rights; the server re-derives them from Orgo on every call.

**D4. Step state on the program.** A small JSON column on `programs` (`orgo_steps`: for each step, `done | failed`, counts and the time) lets the page show what is missing and retry only that step. It holds no names or identifiers. The event link already stored with the wrong path is corrected when it is next read (a link is rebuilt from the uuid, never stored as text again).

**D5. Description as one pure HTML builder.** `buildOrgoDescription(program, blocks, desafios)` returns HTML limited to the tags Orgo renders, with every stored value escaped, and the length rule from the spec. The program is a list, not a table. It is unit-tested without the network. The *desafios* come from one query over the program's activities: `activity_challenges`, `activity_educational_goals` for the behaviours per objective and division, `challenge_goals` to relate a *desafio* to its objectives.

**D6. Desafio signing is a hint, not a promise.** The text says a *desafio* may be signed only if the behaviours were observed; nothing in the app records or checks signatures.

**D7. Attachment through the existing PDF export, for public programs.** The server renders the program PDF with the same path as the download, asks Orgo for a signed upload, sends the file, and registers it. A private program is never attached, because Orgo stores event files in a public-read bucket. No link to the app is ever put in the event for a private program. The size limit for files is still to be measured (task 1.5).

**D8. Participants never persist.** The options endpoint returns member names, divisão and card number, with opaque Orgo identifiers, to the owner's browser for the dialog; the create request returns only counts. The server re-fetches and compares, it does not store. Logs and usage events carry counts only. The privacy notice gets a sentence (for approval).

**D9. The leader's scope comes from the leader's own Orgo account.** The token is an admin's, so the server decides what a leader may see. It identifies the leader by the Orgo user id that the login returns (`sub`, which is the Orgo user id), not by an email lookup, and reads that user's `permissions` through the token. The suffix of an `EVENT_` permission gives the level: `_LOCAL` is the leader's own local group (`localCenter`), `_PARENT_LOCAL` the groups below their parent group, `_TENANT` everyone (national). For now only the own-local-group view is built: any `EVENT_` permission, at any level, gives the leader's own local group, and the parent-group and national views are shelved (the suffix is already read, so they can be added later without redoing the model). The server lists only that group's members. Anything not recognised is treated as no scope and the participants section is hidden. The permissions are read again whenever the dialog opens, so a role change applies without a new login. The login's `roles` and `groups` claims would be a useful cross-check, but the Orgo app registered for the Kit is not allowed those scopes yet; nothing depends on them.

**D10. The participant tree.** Level 1 is the leader's own local group (groups below a parent group are shelved). Level 2 is the divisão, derived from the member's `type` and matched to the divisão units by `userType`. Patrulhas are not a level until Orgo exposes membership; members are shown under their divisão. A group, or a divisão inside a group, can be selected in one action. Search runs on the server against name and card number inside the leader's scope. At most 500 are sent.

**D11. Invitations run one request per member.** A repeated invitation answers 400 "Member is already attending this event" and counts as added. Requests run with a small concurrency limit; a failed one is counted, not retried silently.

## Risks / Trade-offs

- **The leader's level is read, not enforced, by Orgo** → the token is an admin's, so our server is the only enforcement point. It re-reads the leader's permissions on every options and create request and hides the picker when the level is unknown. Checked with a local-level leader. Parent-group and national views are shelved, so a parent-level leader is not needed for this change.
- **Minors' data in transit and in the dialog** → server-side scope check, no storage, no logging, counts only in telemetry, privacy notice updated.
- **A public file link** → attachment only for public programs; the privacy notice says so.
- **Publishing notifies members** → the dialog warns before confirming, and publishing stays opt-in.
- **Owner is the token's admin** → leaders cannot edit the event in eAEP unless their own role allows it; the dialog does not promise it.
- **Write token scope** → the token is global; the server enforces the owner's rights itself (unit list, participant list).
- **A partly created event** → steps are recorded and retryable; the event uuid is stored first.
- **Orgo changes its API** → one client module localises the impact; the e2e stub keeps the flow testable.

## Migration Plan

1. Finish the remaining checks (task 1.5).
2. Add the `orgo_steps` column (committed migration; ask before generating or applying).
3. Fix the event link path in the client and the stored links.
4. Ship behind the existing Orgo configuration check (no token, no feature); try on the test group (local center 3200) with a test leader before real groups.
5. Rollback: the old dialog behaviour is a subset of the new one (minimal event, draft, no participants, no attachment); switching the steps off returns to it.

## Open Questions

- How does a leader below `ADMIN_TENANT` appear in `user_roles` / user permissions, and which field gives local, parent and national level? (task 1.5)
- (Answered) Orgo does not email an invited member when the event has no registration form; they find the event in eAEP.
- (Answered) After a check-in an attendee's `statusRsvp` goes from `maybe` to `attending`; the event analytics then read `rsvp.attending`. A member who replies yes themselves gets the same value, so "present" and "confirmed" cannot be told apart: the page says "confirmados".
- Should the owner be able to re-send participants or the PDF after later changes to the program? Out of scope; the retry only repeats failed steps.

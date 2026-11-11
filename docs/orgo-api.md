# Orgo API: findings for `orgo-event-revamp`

Source: the published OpenAPI (`https://orgo.space/docs/api-reference/openapi.json`, index at `https://orgo.space/docs/llms.txt`) and the permissions page (`/docs/platform/permissions`).
Status: **documentation read (task 1.1). Live probes (1.2, 1.3) are still to do** against the test local group, unit `3200`. Items marked *to verify* depend on them.

## Summary against the five features

| Feature | In the API? | Endpoint | Notes |
|---|---|---|---|
| Richer event description | Yes | `POST /api/v1/events` (`description`) | `string\|null`. **Rendered as HTML, not Markdown** (checked in eAEP): `<b>`, `<u>` and `<a>` are formatted, pipe tables and `**bold**` show as plain text. Stored verbatim, no sanitising on write. At least 100,000 characters are accepted. |
| Event options | Partly | `POST /api/v1/events` | `maxCapacity`, `settings[]`, `type` (event_types), `customStatus`, `isUnlisted`, `hasPublicAttendeeList`, `requiresRegistrationForm`, `registrationFormText` (max 2000), reminders. No `options` field. |
| Participants | Yes, via attendances | `POST /api/v1/event_attends` | Body `{event, user, isInvited, ...}`. When `user` differs from the token's user it becomes an **invitation** (invite email sent only for events with registration forms). Validates unit membership for unit-scoped events and capacity; rejects duplicates. One call per participant. `POST /events/{uuid}/send-invites` emails all eligible members of a *published* event (not a selection). `POST /event_attend_invite_external` invites by email (creates a Contact). |
| Listing a unit's members | Yes, via roles | `GET /api/v1/user_roles?unit=…&exists[dateEnded]=false` | `unit[]`, `user`, `role` filters, up to 200 per page. `GET /unit-user-roles?localCenter=…` returns full user details but needs `HR_LOCAL`. Visibility follows Orgo's member-directory settings. |
| Attachment (PDF) | **Yes, by a 3-step upload (see "Event files")** | `POST /api/v1/event_media` | Body `{event, media}` where `media` is an IRI such as `/api/v1/media/1`. No endpoint creates a `media` object (the only uploads found are `website-media/upload-base64`, `website-documents/upload`, Drive). The event `logo` is a string. *To verify* whether a Drive file or website document can be used. Assume **unsupported** until a probe shows otherwise. |
| Attendance | Yes | `GET /api/v1/event_attends?event=…` | Fields `statusRsvp`, `statusRegistration`, `isInvited`, `canceledAt`. Page size up to 100. `GET /events/{uuid}/analytics` and `/attendees-export` also exist. *To verify:* the status values that mean "present". |
| Publish | Yes | `PATCH /api/v1/events_publish/{uuid}` | Requires event ownership, `EVENT_TENANT` or `EVENT_LOCAL`. Fails if already published. For future events it notifies the unit's members. Do **not** use `event-go-publish` (it builds a public landing page). |

## Details

### Create an event (`POST /api/v1/events`)
- The event is created as a draft. The server sets owner and tenant. `status` is not in the write schema (the docs example still sends `"status": "DRAFT"`, as `map-event.ts` does).
- No field is required at schema level.
- `unit` is an IRI (`/api/v1/units/3200`). `dateTimeBegin` and `dateTimeEnd` are date-time, `timezone` is a string.
- `hasEventTicketing` defaults to `false`; a non-financial user cannot enable it or public visibility. `isPublic` may therefore be refused for some roles.
- There is no `participants` or `attachments` field. `numberOfParticipants` is a plain number.
- Extra fields exist that we do not use: `templateId`, `useTemplateHero`, `propagateToLocalCenters`.

### Permissions
- Strings are `DOMAIN_SCOPE`: domains `ADMIN`, `HR`, `HR_ASSISTANT`, `FINANCIAL`, `EVENT`, `COMMUNICATION`; scopes `_TENANT`, `_PARENT_LOCAL`, `_LOCAL`. `ADMIN_TENANT` passes every check.
- Publishing is governed by the tenant setting "Who can create public posts (Events)" (default HR) and, for publish, by ownership or `EVENT_TENANT`/`EVENT_LOCAL`.
- "Restrict events by user type" can deny a manager even with the right permission.
- Member listing is governed by the tenant settings "Who can see members in local center" and "…in general unit group" (default: regular user); a chapter manager sees only their chapter.
- The write token is an `Api-Token`; the endpoints accept `ApiToken` or `JWT`. *To verify:* which identity the token acts as, since the `owner` and the ownership checks above depend on it. The server must therefore enforce the signed-in leader's rights itself (as `client.ts` already does for units).

## What this means for the specs

1. **Participants** stay, but as invitations (`event_attends` with `isInvited`), one request per person, not one bulk call. The 500-participant cap needs a concurrency and failure policy. Partial failure per count already matches the spec. Whether the invitee gets an email without a registration form is *to verify*.
2. **Members to offer** come from `user_roles` filtered by the chosen unit (active roles only), de-duplicated by user.
3. **Attachment**: very likely cut. The fallback already in the spec (the PDF stays in the app and the description says so) becomes the default behaviour.
4. **Description**: keep it as plain text unless the probe shows Markdown or HTML rendering. A table then needs a plain-text layout.
5. **Attendance** is read from `event_attends`; the "present" status value is needed.
6. **Publish** keeps using `events_publish`. Rights come from Orgo roles plus the tenant setting, so "role allows publish" can only be confirmed by trying; plan for a clean fallback to draft.

## Live probe results (production host `eaep.escoteiros.pt`, local center 3200 only)

Earlier probes ran with a placeholder or an unrecognised token, so their 404s ("No user associated with this API Token") meant nothing and are discarded. The tenant is chosen only by the request `Host`; `eaep.escoteiros.pt` is registered as the tenant's custom domain and works. With a valid token (64 characters, `Api-Token` header, no `Bearer`):

- `3200` is a **local center** ("Grupo 312 Coimbra"), readable without a token. It has 10 units in `localUnits`: 3254 Tribo de Exploradores, 3255 Tribo de Escoteiros, 3256 Patrulha Rouxinol, 3274 Clã, 3276 Chefia, 3277 Patrulha Urubu, 3279 Patrulha Javali, 3284 Alcateia, 3286 Bando Ruivo, 3289 Equipa Kaladin Stormblessed. Events are created in a **unit** (`/api/v1/units/3254`), not in the local center. `whoCanCreateEvents` is null.
- **Create:** `POST /events` with unit, name, times, timezone, `isPublic: false`, `hasEventTicketing: false` returns 201. The event is a draft, in the unit given, and an owner is set (the token's user).
- **Description:** stored exactly as sent, including Markdown, a table in pipes and a `<script>` tag. So Orgo does not sanitise on write. Whether the page renders Markdown or HTML, and how it escapes on display, is still unknown (see below). Accepted up to at least 100,000 characters (PATCH 2k, 8k, 30k and 100k all 200).
- **Delete:** `DELETE /events/{uuid}` returns 204, so test events can be removed.
- **`event_media`** with a made-up media IRI returned 403 "Access Denied", which does not say whether attachments are possible. `website-media/upload-base64` is reachable (422 on bogus data) but it stores website images, not event attachments. Attachments stay assumed unsupported.
- **The token acts as an `ADMIN_TENANT` user** (`GET /api/v1/me`: `ROLE_ADMIN_TENANT`, every `ADMIN_`, `EVENT_`, `HR_`, `HR_ASSISTANT_`, `FINANCIAL_`, `COMMUNICATION_` scope at local, parent and tenant level). So the earlier 403 was not about rights. `user_roles?unit=<IRI>` gives 403, while `unit[]=<id>` and `unit=<id>` give 200: the format of the filter matters. Use the array form.
- **A unit's members are not stored as unit roles.** `unit-user-roles?localCenter=3200` lists the 10 units, each with `users: 0` and `userRoles: 0`. `user_roles?unit[]=3254` has 0 rows (3200 itself has 8, with no permission value). A user's `userRoles` is empty and `roleGroups` is just `[3200]`.
- **Members belong to the local center, and the section shows in `type`.** `GET /users?localCenter=3200` returns 75 users (use the bare id; the IRI gives 400). Their `type` is the division or role: Dirigente, Lobito, Explorador, Escoteiro, Caminheiro. A unit like "Tribo de Exploradores" has no member list of its own, so a participants list for a unit would have to come from the local center, filtered by `type` (Alcateia = Lobito, Tribo de Exploradores = Explorador, Tribo de Escoteiros = Escoteiro, Clã = Caminheiro, Chefia = Dirigente). Patrulhas, Bando Ruivo and Equipa Kaladin have no obvious `type`.
- `event_attends` needs an `event` filter (403 "Event attend filter missing" without it). `event_types` is 403 even for this admin and is not needed. `GET /api/v1/me` identifies the token's user.
- **Invitations need a published event.** `POST /event_attends` on a draft returns 400 "Publish the event first" (same for a repeat). `GET /event_attends?event=…` on a draft returns 403. So the order is create, **publish**, then invite, and a leader who cannot publish cannot invite through the API. Publishing a future event notifies the unit's members, so it is not a silent step.
- **A unit has a `userType` and `activeMemberCount`.** Unit 3254 (unitType "Divisão") has `userType: Explorador`; `activeMemberCount` was 0, so it is not reliable. This is the native link between a unit and the `type` of its members.
- **Member search works**, restricted to a local center: `GET /users?localCenter=3200&lastName=…` (partial match works), `&keyword=…` (matches the first name) and `&cardId=…`. `cardId` exists on the user and is the card number.
- **Local center hierarchy:** local center 3200 has `parent: 3240` and `ancestors: [3240]`; `GET /local_centers?parent=<id>` lists children (3200 has none; its parent has 2, including 3200).
- **Front-end event URLs** (read from the eAEP web app's route table, not documented): view `/event/<uuid>`, edit `/events/edit/<uuid>`, attendance `/events/attend/<uuid>`, public view `/public/event/<uuid>`. The app's current link `/events/<uuid>` (built in `src/lib/orgo/client.ts`) is not a route and shows "not found". The host is a single-page app that answers 200 for any path, so a status check cannot detect this.
- Test draft (kept for a visual check): `https://eaep.escoteiros.pt/event/5tkcgp03qa8s89n04vej8rn445` in unit 3254. Delete it afterwards.
- **Event files (works, verified on the draft).** `event_media` and `POST /media_objects` are not the route (the latter accepts images only, and `type=eventfile` there is refused). The web app does: (1) `GET /s3-upload?fileType=<mime>&fileName=<name>&type=eventfile` returns `{url, newFileName, additionalData}` (a signed S3 POST form); (2) POST the file to `url` as multipart (all `additionalData` fields, `Content-type`, `acl=public-read`, then `file` named `newFileName`), expect 204; (3) `POST /medias` with `{contentUrl: newFileName, mimeType, type: "eventfile", size, entityId: <event id>}` returns 201 and the event's `eventMedia` then lists it. The bucket is `orgostatic.s3.eu-central-1.amazonaws.com`, shared and **public-read**: anyone who has the link can open the file, and the link is stored on the event. The web app caps uploads at 50 MB for images; the limit for files was not checked.
- **Description tags that render** (checked in eAEP): `<p>`, `<b>`/`<strong>`, `<em>`/`<i>`, `<u>`, `<s>`, `<h3>`, `<ul>`/`<ol>`/`<li>`, `<br>`, `<a>`, and entities (`&amp;`, `&lt;`, `&ndash;`, accents). **Not kept:** `<table>` (cells run together), `style` colours, `<div>`. `<script>` and `<img onerror>` produce nothing on display, so Orgo sanitises when it renders. A schedule must therefore be a list, one line per block.
- **Unit 3200 also exists as a unit**: "Grupo 312 Coimbra", `activeMemberCount` 3 (the group leadership), `parent` 3240, with `localUnits`. A local center and its group-level unit share the id.
- **Publish** (`PATCH /events_publish/<uuid>`, merge-patch, `{}`) returned 200 and the event became `published`. It was done on a future event in unit 3200, which notifies that unit's members.
- **Invite** (after publish): `POST /event_attends {event, user, isInvited: true}` returned 201 with `statusRsvp: "maybe"`, `statusRegistration: "invited"`, no registration link or hash. The invitee (a member of the group, not one of unit 3200's three role holders) was accepted, so unit membership is not required for a group member. The same call again returns **400 "Member is already attending this event"**, which can be treated as "already added".
- **Attendance:** `GET /event_attends?event=<numeric event id>` works (200, one row per attendee with `statusRsvp`, `statusRegistration`, `isInvited`, `canceledAt`). The IRI or uuid form gives 403 "Event attend filter missing". `GET /events/<uuid>/analytics` returns counts only (`attendees`, `rsvp`, `capacity`, `revenue`, `registrationsOverTime`) and is the better source for "N present of M invited". Which value means "present" was not checked, because nobody has checked in. `attendees-export` returns 200 (not inspected).
- **A non-admin leader, signed in through the app's OAuth flow** (test account, Dirigente in local center 3200):
  - Login with `profile email` works. The `userinfo` claims are `sub, name, given_name, family_name, picture, email, email_verified, tenant_id`. **`sub` is the Orgo user id** (`GET /users/<sub>` returns that person). Asking for `roles groups` is refused by Orgo ("Scope(s) not granted to this client: roles groups"): the OAuth app registered for the Kit would have to be given those scopes by an Orgo admin.
  - Through the admin token, `GET /users/<sub>` gives the leader's scoped permissions: `permissions: [ADMIN_LOCAL, COMMUNICATION_LOCAL, EVENT_LOCAL, FINANCIAL_LOCAL, HR_ASSISTANT_LOCAL, HR_LOCAL]`, `roles: [ROLE_USER]`, `type: Dirigente`, `localCenter: 3200`, and `userRoles` by name. The admin account has the same list at `_LOCAL`, `_PARENT_LOCAL` and `_TENANT`. So the level of a leader reads straight from the suffix: `_LOCAL` = their own local group, `_PARENT_LOCAL` = the groups below their parent group, `_TENANT` = everyone.
  - `GET /user_roles?user=<IRI>` is 403 (the array form `user[]=<id>` should be used, as with `unit[]`).
- **Real-Orgo check of the new client code** (local center 3200, no publish, nobody notified; a draft in unit 3254 was created, given a file, inspected and deleted): the leader read (`getOrgoUser`), the unit tree (10 units: 5 divisões and 5 patrulhas) and the dialog's 11 unit options, the member list and search, creating a draft with the HTML description, the three-step file upload (the event's `eventMedia` then reports a file, which is how a retry avoids attaching twice), counting attendees on a draft (0) and the refusal of an invitation to a draft (`400 Publish the event first`) all behaved as designed.
- **Member status in the test group:** `GET /users?localCenter=3200` returns 76 rows: 4 `ACTIVE` (all Dirigente), 71 `INACTIVE` (the Lobitos, Exploradores, Escoteiros and Caminheiros) and 1 `EXCLUDED`. The picker lists `ACTIVE` members only, so this group shows 4 members. Whether `INACTIVE` members should be offered is a decision still to be made.
- **Publish needs `Content-Type: application/merge-patch+json`.** `PATCH /events_publish/<uuid>` with plain `application/json` answers `415`. The app used the wrong header before this change, so publishing from the app never worked; fixed in `publishOrgoEvent`.
- **Full flow checked against the real Orgo** (local center 3200, unit 3289 with no members, so nobody was notified): publish, invite (accepted although the invitee is a Dirigente of the group, not a member of that unit), program PDF attached (`hasFile` true), attendance rows 1, invite again counted as added, attach again added no second file, publish again was already done.
- **File size limit:** the signed upload policy from `GET /s3-upload` allows `content-length-range` 1 byte to 1,073,741,824 (1 GiB). The app caps the program PDF at 20 MB, far below that. (The eAEP web app may apply its own, lower cap in its screens; not checked.)
- **Check-in** (done by a leader on the attendance page): the attendee's `statusRsvp` goes from `maybe` to `attending`; `statusRegistration` stays `invited`. `GET /events/<uuid>/analytics` then reads `attendees: {invited: 1}` and `rsvp: {attending: 1}`. A member who answers yes to the invitation gets the same `attending`, so a check-in cannot be told from a confirmation; the app shows "confirmados".
- **No email to an invited member** when the event has no registration form (checked: the invitee got no email after being invited to a published event with `requiresRegistrationForm: false`). This matches the OpenAPI, which sends the invite email only for events with a registration form. Invited members find the event in eAEP.

## Probes still to do (units of local center 3200 only)

Read-only first:
- `GET /api/v1/units/3200` (name, level) and `GET /api/v1/user_roles?unit=/api/v1/units/3200` (members, permission strings).
- `GET /api/v1/event_types`, and `GET /api/v1/events?unit=/api/v1/units/3200` for an existing event's shape and description format.

Writes (test unit only, draft events, deleted afterwards):
- Create a draft with a long Markdown/HTML description; read it back and check how it is stored.
- Invite one test member with `event_attends`; then read the attendance.
- `event_media` with a made-up media IRI, to see whether anything can supply a valid one.
- Publish as a leader who can and one who cannot.

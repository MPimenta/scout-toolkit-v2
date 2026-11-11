## 1. Discovery

- [x] 1.1 Find the Orgo API documentation or OpenAPI for the issuer (done: `https://orgo.space/docs/api-reference/openapi.json`)
- [x] 1.2 Probe read-only against the AEP tenant limited to local center 3200: roles and permission strings, members, description format and length, attachment support
- [x] 1.3 Probe a create, a publish, an invitation and an attachment on test events in units of 3200 (test events deleted)
- [x] 1.4 Write `docs/orgo-api.md` and revise the specs and design to it
- [x] 1.5 Remaining checks before the picker and the attachment are built: (a) ~~a non-admin leader's scope~~ done: the leader's `permissions` on `GET /users/<sub>` carry the level as a suffix (`EVENT_LOCAL`, `EVENT_PARENT_LOCAL`, `EVENT_TENANT`); parent-group and national views are shelved; whether the Orgo OAuth app can be given the `roles` and `groups` scopes is an optional cross-check; (b) ~~a real-size program PDF and its size limit~~ done: Orgo storage accepts up to 1 GiB and a real program PDF attached fine; (c) ~~the attendee status after a real check-in~~ done: `statusRsvp` becomes `attending`, read as `rsvp.attending` in the event analytics; the page shows "N confirmados de M convidados"; (d) ~~whether an invited member gets an email~~ done: no email is sent for an event without a registration form

## 2. Orgo client

- [x] 2.1 Fix the event link: build `/event/<uuid>` from the uuid (never store it as text) and show the attendance link `/events/attend/<uuid>`; update the places that use the old path
- [x] 2.2 Extend `src/lib/orgo/client.ts`: members of a local center with search by name and card number, the unit tree of a local center (divisões and patrulhas), publish (already there), invitation with the "already attending" case, three-step file upload, event counts from `analytics`
- [x] 2.3 Scope module: read the signed-in leader's permissions by Orgo user id (the login's `sub`) and return their own local group when they hold any `EVENT_` permission; none otherwise; e2e stub reports a scope. Parent-group and national views are shelved
- [x] 2.4 Unit tests with fake Orgo responses: unknown permission treated as not allowed, exact-email identity rule unchanged, members limited to the leader's scope, repeated invitation counted as added

## 3. Description builder

- [x] 3.1 Query for the program's *desafios* with short titles, integration marker, contributing blocks and observable behaviours per objective and division
- [x] 3.2 `buildOrgoDescription` in HTML limited to the tags Orgo renders (program list, *desafios* section, intro paragraph, escaping, length rule)
- [x] 3.3 Unit tests: three blocks, empty program, no *desafios*, mandatory marker, markup in titles, too-long text keeps the list

## 4. Endpoint and steps

- [x] 4.1 Add `programs.orgo_steps` (JSON, no personal data); generate and review the migration (ask first)
- [x] 4.2 `GET /api/programs/[id]/orgo/options?unit=…`: units, publish right, attachment rule, participant tree for the leader's scope with server-side search; owner only
- [x] 4.3 Make `POST` step-wise: create, publish, invitations, attachment; record each step; reject participant ids that were not offered; keep the claim/double-submit protection
- [x] 4.4 Retry for a failed step without creating a second event or inviting twice
- [x] 4.5 PDF generation for the attachment from the existing export, only for public programs, with the size check
- [x] 4.6 Logs and usage events carry counts only; add the privacy sentences to the notice (data sent to Orgo, public file link)
- [x] 4.7 Classify any new route in `FEATURE_ROUTES`; API tests for 400, 401, 403, 409, 503 and the forged participant id

## 5. Dialog

- [x] 5.1 Rebuild `CreateOrgoEventDialog` as a sectioned popup (Evento, Participantes, Descrição e anexo) from the options endpoint; use `ui-proposal.html` as the reference
- [x] 5.2 Participant picker: the leader's own local group, tree (grupo, divisão), search by name or card number, invite all / a group / a selection, count, nobody by default; the explanation when the role cannot publish or the scope is unknown
- [x] 5.3 Publish warning ("os membros da unidade serão notificados") and "Quem vê este evento" line; step result screen with per-step status and retry
- [x] 5.4 Program page: link to the event and to attendance, counts where available or the eAEP sentence
- [x] 5.5 Messages in `pt.json` and `en.json`

## 6. Verification

- [x] 6.1 Unit, integration (Orgo stub) and e2e tests: full flow, partial failure and retry, role without publish right, scope unknown, private program without attachment
- [x] 6.2 Manual run against the test group (local center 3200) with a test leader; record the result in the change. Done 2026-11-11 with the app code against the real Orgo, in unit 3289 (no members, so nobody was notified), leader 204598, invitee 62424: scope read, 11 units and 4 active members offered, a made-up member id rejected, HTML description with 2 desafios, event created as a draft, publish (failed at first with 415 because the PATCH was not merge-patch; fixed), 1 invitation accepted, program PDF attached, attendance rows 1, and every repeat safe (invite again counts as added, attach again adds no second file, publish again is done). The test event is kept in Orgo for inspection.
- [x] 6.3 `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run test:e2e`; update `docs/architecture.md`, `docs/api.md`; `openspec validate orgo-event-revamp --strict`

## 1. Discovery (blocks everything else)

- [ ] 1.1 Find the Orgo API documentation or OpenAPI for the issuer, and list the endpoints and fields for events, event options, participants or registrations, attachments, descriptions and attendance
- [ ] 1.2 With the write token against a non-production Orgo and a test leader, probe read-only: the user's roles and permission strings, the members a leader can list per unit, the accepted description format and maximum length, attachment support and size limit
- [ ] 1.3 Probe one create on a test unit: event with participants, with an attachment, publish by a role that may and by one that may not; note what attendance looks like afterwards
- [ ] 1.4 Write `docs/orgo-api.md` with the answers; run `/opsx:update orgo-event-revamp` to revise the specs and design to what Orgo offers (drop or reshape any capability it cannot support)

## 2. Orgo client and capabilities

- [ ] 2.1 Capability probe module (participants, attachments, attendance, publish right per unit), cached per request; e2e stub reports everything supported
- [ ] 2.2 Extend `src/lib/orgo/client.ts`: role permissions beyond event-create, members of a unit the leader may see, add participants, upload attachment, read attendance counts (only those the discovery confirmed)
- [ ] 2.3 Unit tests with fake Orgo responses: unknown permission treated as not allowed, exact-email identity rule unchanged, member list limited to the chosen unit

## 3. Description builder

- [ ] 3.1 Query for the program's *desafios* with short titles, integration marker, contributing blocks and observable behaviours per objective and division
- [ ] 3.2 `buildOrgoDescription` (program table, *desafios* section, intro line, escaping, length rule) in the format Orgo accepts
- [ ] 3.3 Unit tests: three blocks, empty program, no *desafios*, mandatory marker, markup in titles, too-long text keeps the table

## 4. Endpoint and steps

- [ ] 4.1 Add `programs.orgo_steps` (JSON, no personal data); generate and review the migration (ask first)
- [ ] 4.2 `GET /api/programs/[id]/orgo/options?unit=…` returning allowed options, publish right, invitable members and capability flags; owner only
- [ ] 4.3 Make `POST` step-wise: create, then participants, attachment, publish; record each step; reject participant ids that were not offered; keep the claim/double-submit protection
- [ ] 4.4 Retry for a failed step without creating a second event
- [ ] 4.5 PDF generation for the attachment from the existing export, with the size check; no app link for private programs
- [ ] 4.6 Logs and usage events carry counts only; add the privacy sentence to the notice (for approval)
- [ ] 4.7 Classify any new route in `FEATURE_ROUTES`; API tests for 400, 401, 403, 409, 503 and the forged participant id

## 5. Dialog

- [ ] 5.1 Rebuild `CreateOrgoEventDialog` as a sectioned popup (Evento, Participantes, Descrição e anexo), options driven by the options endpoint and capability flags
- [ ] 5.2 Participant picker: list, invite all, selection, count, nobody by default; the explanation when the role cannot list members
- [ ] 5.3 "Quem vê este evento" line per unit level; step result screen with per-step status and retry
- [ ] 5.4 Program page: link to the event, attendance counts where available or the eAEP sentence
- [ ] 5.5 Messages in `pt.json` and `en.json` (Portuguese copy for approval)

## 6. Verification

- [ ] 6.1 Unit, integration (Orgo stub) and e2e tests: full flow, partial failure and retry, role without publish right, role without member list
- [ ] 6.2 Manual run against a non-production Orgo with a test leader and a test unit; record the result in the change
- [ ] 6.3 `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run test:e2e`; update `docs/architecture.md`, `docs/api.md`; `openspec validate orgo-event-revamp --strict`

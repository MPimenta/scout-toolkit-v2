## Context

See proposal.md for why. What exists (read for this design):

- `src/lib/orgo/client.ts` talks to `{ORGO_ISSUER}/api/v1` with an `Api-Token` header: it finds the user by exact email, reads `user_roles` to derive the units where the role starts with `EVENT_` or `ADMIN_`, creates events (`POST /api/v1/events`) and publishes them. `map-event.ts` builds the payload (one-line description, `status: DRAFT`, ticketing off). `claim.ts` stores the event uuid on the program and prevents double creation. `CreateOrgoEventDialog.tsx` is the current dialog; `src/app/api/programs/[id]/orgo/route.ts` is the endpoint; `isE2EOrgoStub` provides a stub for e2e users.
- The program has blocks (`program_entries` with times, custom title, optional activity) and the PDF export exists (`program-export`, Playwright PDF).
- What the repository does **not** tell us about Orgo: which fields an event accepts besides those sent today, whether events have types or categories, how participants or invitations are modelled and which endpoint adds them, whether events accept attachments, what format the description takes (plain, markdown, HTML), how attendance is modelled and exposed, and which permission strings gate which action. Every feature in this change depends on one of those answers.
- Activity data needed for the description: the *desafios* linked to each activity (with short titles and the integration marker from `reference-sheet-alignment`), and the observable behaviours stored per activity, objective and division.

## Goals / Non-Goals

**Goals:**
- Hand the whole plan over to eAEP in one action, within the leader's rights.
- Keep minors' data out of the app.
- Degrade clearly: whatever Orgo cannot do, the dialog says so instead of failing late.

**Non-Goals:**
- No sync of later program edits, no editing or cancelling the Orgo event from the app.
- No ticketing, price or product creation.
- No copy of attendance or participants into the app's database.

## Decisions

**D1. Discovery gates the build.** Section 1 of the tasks probes Orgo (documentation or OpenAPI of the issuer, then read-only calls with the write token against a **non-production** Orgo) and records the answers in a short `docs/orgo-api.md`. Then `/opsx:update` revises the specs to what Orgo really offers (for example, if participants are "registrations" created by the user themselves, the participants capability changes). Nothing in sections 2 onwards starts before that. *Alternative:* build to the spec and discover in implementation. Rejected: three of the five features may not exist in the API, and the specs would be wrong.

**D2. A capability probe, not hard-coded assumptions.** A small server module reports what the connected Orgo supports (participants, attachments, attendance, publish right for a unit). The dialog is built from that report, so sections appear only when they can work, and the same code runs against the e2e stub with every capability on.

**D3. Options endpoint plus step-wise create.** `GET /api/programs/[id]/orgo/options?unit=…` returns, for the signed-in owner and the chosen unit: allowed event options, publish right, members the owner may invite, and the capability flags. `POST` creates the event and then runs participants, attachment and publish as separate steps, each recorded as done or failed. The browser never decides rights; the server re-derives them from Orgo on every call.

**D4. Step state on the program.** A small JSON column on `programs` (`orgo_steps`: for each step, `done | failed`, counts and the time) lets the page show what is missing and retry only that step. It holds no names or identifiers. *Alternative:* keep nothing and ask Orgo each time. Rejected: Orgo may not expose enough to tell, and a retry must know what was already added.

**D5. Description as one pure builder.** `buildOrgoDescription(program, blocks, desafios)` returns the text in the format Orgo accepts (decided in D1), with escaping and the length rule from the spec. It is unit-tested without the network. The *desafios* come from one query over the program's activities: `activity_challenges` for the *desafios*, `activity_educational_goals` for the behaviours per objective and division, `challenge_goals` to relate a *desafio* to the objectives it develops, so a behaviour is listed under a *desafio* only when its objective is one of that *desafio*'s objectives and the division matches.

**D6. Desafio signing is a hint, not a promise.** The text says a *desafio* may be signed only if the behaviours were observed; nothing in the app records or checks signatures.

**D7. Attachment through the existing PDF export.** The server renders the program PDF with the same path as the download, then uploads it if the capability probe says Orgo accepts attachments and the size is within the limit. For a private program no link to the app is ever put in the event.

**D8. Participants never persist.** The options endpoint returns member names and opaque Orgo identifiers to the owner's browser for the dialog; the create request returns only counts. The server keeps the offered identifiers for the duration of the request chain by re-fetching and comparing, not by storing. Logs and usage events carry counts only. The privacy notice gets a sentence (for approval).

**D9. Roles come from Orgo.** Event-create units already come from `user_roles`; the same call is extended to read the finer permission strings (for example publish or member-list rights) once D1 names them. Anything not recognised is treated as not allowed.

## Risks / Trade-offs

- **The API cannot do what the specs say** → D1 gate; specs are revised before code.
- **Minors' data in transit and in the dialog** → server-side rights check, no storage, no logging, counts only in telemetry, privacy notice updated.
- **Write token scope** → the token is global; the server must enforce the owner's rights itself (unit list, participant list), as it already does for units.
- **A partly created event** → steps are recorded and retryable; the event uuid is stored first.
- **Long programs make a long description** → the shortening rule keeps the table complete.
- **Orgo changes its API** → the capability probe and one client module localise the impact; the e2e stub keeps the flow testable.

## Migration Plan

1. Discovery against non-production Orgo; write `docs/orgo-api.md`; update the specs.
2. Add the `orgo_steps` column (committed migration; ask before generating or applying).
3. Ship behind the existing Orgo configuration check (no token, no feature); try on a test unit with a test leader before real units.
4. Rollback: the old dialog behaviour is a subset of the new one (minimal event, no participants, no attachment); disabling the capability flags returns to it.

## Open Questions

- Should the owner be able to re-send participants or the PDF after later changes to the program? Out of scope here; the retry only repeats failed steps.

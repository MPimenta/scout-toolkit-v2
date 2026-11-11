## Why

Today the "criar no Orgo" button opens a small dialog that creates a **draft event with a one-line description** ("Programa criado por … Atividades: …"). The leader still has to rebuild the program in eAEP, invite the participants and, later, work out which *desafios* the youth could be signed for. The program the leader built in the Kit de Atividades — times, activities, the educational objectives and the behaviours to observe — never reaches the place where attendance and progress are actually recorded. This change makes the button hand over the whole plan.

The Orgo API was explored against the AEP tenant (see `docs/orgo-api.md`). What it offers shapes this change: participants are **invitations that need a published event**, the description is **HTML**, a PDF is attached by a **three-step upload to a public bucket**, and members belong to the **local group**, not to a unit.

## What Changes

- **A real event popup** opened from the program page. It is prefilled from the program and offers the details Orgo accepts for events, limited to what the signed-in leader's Orgo role allows (units where they can create events, publishing only if their role allows it). It still never asks for timezone, ticketing or price.
- **Participants as invitations.** After the event is created and **published**, the leader can invite members of their own local group. Invitations are sent to Orgo and are **not stored** in the Kit de Atividades. A leader whose role cannot publish cannot invite from the app; the dialog says so.
- **A scoped picker.** A leader sees their own local group's members, filtered by divisão, and can select a whole group or a whole divisão in one action. Members can be searched by name or by card number (*número associativo*). Leaders with parent-group or national permissions also see only their own local group for now; the views for the groups below a parent group, and one level higher, are shelved for a later change.
- **A complete description, in HTML.** The event description carries the program as a list (one line per block: start, end, duration, title) and, at the end, a section listing the *desafios* the leader could sign if the behaviours are observed: for each *desafio* its code and short title, the divisions, the contributing blocks and the observable behaviours of the linked objectives. *Desafios* mandatory for integration are marked. Orgo renders paragraphs, lists, headings, bold, italic, underline, line breaks and links, and drops tables.
- **A PDF of the program as an attachment, for public programs only.** Orgo stores event files in a public-read bucket, so a private program never gets an attachment. A private program's PDF stays available in the app, and the dialog says why.
- **A warning before publishing.** Publishing a future event notifies the members of its unit. The dialog says so before the leader confirms, because invitations need the publish.
- **The event belongs to the leader's scope.** It is created in the chosen unit (the group-level unit or one of its divisões), so the leaders of that scope see it in eAEP. The program page shows the presence count from the event's counts, never names.
- **A working link.** The event link the app stores and shows today points to a page that does not exist. It becomes `/event/<uuid>`, with the attendance page at `/events/attend/<uuid>`.
- **Retry without duplicates.** Creation runs as steps (event, publish, invitations, attachment). A failed step is reported and can be retried without creating a second event. A repeated invitation (Orgo answers that the member is already attending) counts as added.

## Capabilities

### New Capabilities
- `orgo-event-participants`: choosing and inviting participants from the leader's scope.
- `orgo-event-description`: the generated HTML description (program list, *desafios* to sign with behaviours) and the PDF attachment.

### Modified Capabilities
- `orgo-events`: the dialog asks for more (role-limited options, publish warning, participants), the create request runs in steps in a fixed order and can be retried, the event is created in the leader's scope, the event link is corrected, and attendance is read back as counts.

## Impact

- Code: `src/lib/orgo/` (client for members, invitations, file upload and event counts; description builder; the corrected event URL), `src/app/api/programs/[id]/orgo/route.ts` (options endpoint and step-wise create), `CreateOrgoEventDialog.tsx` (sections, picker, publish warning), the PDF export reused from `program-export`, and messages in `pt.json` and `en.json`.
- Data: nothing about participants is stored. The program keeps the Orgo event uuid and URL; the URL already stored with the wrong path needs correcting. A small record of which steps succeeded is added to `programs`.
- Orgo access: the write token acts as **one admin user** (all scopes). Every event is owned by that user. Orgo therefore never limits what a leader may do through the app: the server must read the signed-in leader's own scope and enforce it.
- Privacy: members include minors. The server sends only identifiers Orgo gave it, nothing is logged or kept, and the privacy notice needs a sentence about the data sent to Orgo and about the public file link (for approval).
- Depends on: `reference-sheet-alignment` (archived: short titles, integration marker, behaviours per objective), the existing `orgo-events`, `program-export` and `program-builder` specs.
- Tests: unit (description builder, escaping, step state, scope), integration against the Orgo stub, e2e with the existing `e2e.` stub path. The Orgo API was exercised on the AEP tenant limited to the test group (local center 3200); a check with a non-admin leader remains (task 1.5).
- Out of scope: syncing later program edits to an existing event, ticketing and payments, editing the event after creation, importing attendance back into the app's own data, sending the "invites" email to the whole unit (`send-invites`).

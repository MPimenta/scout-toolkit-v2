## Why

Today the "criar no Orgo" button opens a small dialog that creates a **draft event with a one-line description** ("Programa criado por … Atividades: …"). The leader still has to rebuild the program in eAEP, invite the participants and, later, work out which *desafios* the youth could be signed for. The program the leader built in the Kit de Atividades — times, activities, the educational objectives and the behaviours to observe — never reaches the place where attendance and progress are actually recorded. This change makes the button hand over the whole plan.

## What Changes

- **A real event popup** opened from the program page. It is prefilled from the program and offers the details Orgo accepts for events, limited to what the signed-in leader's Orgo role allows (units where they can create events, publishing only if their role allows it, extra event options only where Orgo exposes them). It still never asks for timezone, ticketing or price.
- **Participants.** Depending on the leader's role in the chosen unit, the popup lists the unit's members the leader may see in Orgo and lets them invite all, a selection, or nobody. Participants are sent to Orgo and are **not stored** in the Kit de Atividades.
- **A complete description.** The event description carries a table with the program (start, end, duration, activity or block title), and, at the end, a section listing the *desafios* the leader could sign if the behaviours are observed during the program: for each *desafio* its code and short title, the divisions, the activities of the program that contribute, and the observable behaviours of the linked objectives. *Desafios* that are mandatory for integration are marked.
- **A PDF of the program as an attachment**, when Orgo accepts attachments on events. When it does not, the PDF stays available in the app and the description says so.
- **The event belongs to the leader's scope.** It is created in the chosen unit (agrupamento, divisão or other level), so the leaders of that scope see it in eAEP and can take attendance there. Where Orgo exposes attendance to the API, the program page shows the presence count.
- **Retry without duplicates.** Creation runs as steps (event, participants, attachment, publish). A failed step is reported and can be retried without creating a second event.
- **Discovery first.** The Orgo API surface for participants, attachments, description format, event options and attendance is not documented in this repository. The first task is a discovery against a non-production Orgo; the specs then get updated to what Orgo really offers before any code is written (see design).

## Capabilities

### New Capabilities
- `orgo-event-participants`: choosing and inviting participants from the leader's scope.
- `orgo-event-description`: the generated description (program table, *desafios* to sign with behaviours) and the PDF attachment.

### Modified Capabilities
- `orgo-events`: the dialog asks for more (role-limited options, participants), the create request runs in steps and can be retried, the event is created in the leader's scope, and attendance is read back where Orgo allows.

## Impact

- Code: `src/lib/orgo/` (client for participants, attachments and events options; description builder; capability probe), `src/app/api/programs/[id]/orgo/route.ts` (options endpoint and step-wise create), `CreateOrgoEventDialog.tsx` (sections, participant picker), the PDF export reused from `program-export`, and messages in `pt.json` and `en.json`.
- Data: nothing new about participants is stored. The program keeps the Orgo event uuid and URL it has today; an optional record of which steps succeeded may be added (a small column or JSON on `programs`, decided in design).
- Privacy: participants include minors. The server sends only identifiers Orgo gave it, nothing is logged or kept, and the existing privacy notice needs a sentence about the data sent to Orgo (for approval).
- Depends on: `reference-sheet-alignment` (short titles, integration marker, behaviours per objective), the existing `orgo-events`, `program-export` and `program-builder` specs, and Orgo API access with a write token that may need broader scopes.
- Tests: unit (description builder, escaping, step state), integration against the Orgo stub, e2e with the existing `e2e.` stub path; a manual check against a non-production Orgo before any production use.
- Out of scope: syncing later program edits to an existing event (confirm-and-replace stays out), ticketing and payments, editing the event after creation, importing attendance back into the app's own data.

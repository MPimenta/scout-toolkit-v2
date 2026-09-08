## Why

Leaders already classify activities with educational objectives. They also need to tag **challenges** (for example “completar 5 nós”) so a session can be found and understood against the progression programme. Objectives and challenges are different catalogues; only objectives exist today.

## What Changes

- Add a challenge catalogue: a challenge has an id, a name, a description, and belongs to exactly one type (a type MAY have many challenges)
- Add a challenge-type catalogue: a type has an id and a name. Seed the seven types (Estilo de Vida Ativo e Saudável, Vida ao Ar Livre, Comunidade e Cidadania, Valores e Atitudes, Vivência Escotista, Técnicas Úteis, Criatividade). This is **not** educational areas (Social / Liderança / …) and **not** activity types (Jogos / …)
- Associate zero or more challenges with an activity, the same way objectives work
- Show challenges next to objectives on the activity tile, table, and detail page
- Filter the catalogue by challenges with the same multi-select control as objectives
- Let admins maintain challenge types and challenges on `/admin/taxonomias`
- Add a challenges (and objectives) multi-select on the activity editor so association is possible in the UI
- Point Epic 18 in `docs/planning.md` at this change (roadmap only; no duplicated task list)

## Capabilities

### New Capabilities

- `activity-challenges`: Challenge types, challenges, activity association, catalogue display, and challenge filter

### Modified Capabilities

- `admin-taxonomies`: Admin CRUD also covers challenge types and challenges, with the same guest-readable GET and referenced-delete rules
- `admin-activities`: Admin create/update includes challenge ids alongside educational goals and SDGs

## Impact

- Schema: `challenge_types`, `challenges`, `activity_challenges` (Drizzle + migration)
- API: public GET taxonomies; `challenges` query on `/api/activities`; activity list/detail payloads; admin taxonomy + activity write
- UI: tile, table, detail, filters, activity editor, `/admin/taxonomias` tabs; Portuguese chrome plus English catalog keys
- Seed: seven challenge types, ten challenges (each of one type), linked onto the five demo activities
- Tests: unit (card/table/detail/filters), SQL-integration on `scout_toolkit_test`, Playwright filter + admin taxonomy
- Unchanged in this change: Excel import (`admin-activity-excel-import`), program summary/export, edit-suggestions fields
- Roadmap: `docs/planning.md` Epic 18

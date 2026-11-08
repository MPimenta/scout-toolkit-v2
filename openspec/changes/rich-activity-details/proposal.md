## Why

The catalogue is moving to a much richer activity record. The curated activities sheet (tab `atividades_v2`) already carries, for every activity: the source and its licence, structured instructions (preparation, steps, debriefing), a **physical and a psychological risk analysis with a mitigation each**, the **educational objectives per division together with the behaviours that show each objective was reached**, the **SDGs with a justification for each**, and the **Matriz *desafios*** the activity helps with. Today the app stores none of this beyond name, description, materials and instructions, and the detail page cannot show it.

Leaders need this to run an activity safely and to justify it educationally; without it the platform is a list of games, not a programme tool.

## What Changes

- **Data**: add risk analysis (level, description, mitigation, for physical and psychological risk), per-division objective links that carry an *observable behaviour*, a justification per SDG, links from activities to Matriz *desafios*, and a catalogue of **sources** with licence and per-activity link.
- **Instructions** keep one text field but follow a light convention (section headings `Preparação`, `Desenvolvimento`, `Fecho e debriefing`; numbered steps) that the page renders as structure.
- **Detail page**: redesigned around the reading order of a leader preparing a session: summary and key facts, materials, how to run it, **safety (always visible)**, objectives and how to observe them (by division), SDGs and why, *desafios*, source and licence. A phone layout and a desktop layout are specified, with a clickable HTML proposal (`ui-proposal.html`) built from the example activity "Jogo da bandeira".
- **Editor**: admin and proposal forms gain the new fields, organised in steps, with per-division objective blocks and per-SDG justification fields.
- **Import**: the sheet loader maps the new columns (risk text with its level prefix, per-division objective blocks, behaviours, SDG lines, *desafio* codes, source id and link) and reports anything it could not map.
- **Exports** (Excel/PDF) include the new fields.
- **Breaking, internal**: the activity payload replaces `educational_goal_ids` with `objectives: [{ goal_id, age_group, behaviour }]` (the old field stays accepted as a shorthand without behaviours). This **modifies** `progress-matrix-objectives` (see Impact).

## Capabilities

### New Capabilities

- `activity-details`: layout, reading order, responsive behaviour and instruction rendering of the detail page.
- `activity-risk-analysis`: physical and psychological risk, level and mitigation; display and editing.
- `activity-division-objectives`: objectives per division with observable behaviours, and links to *desafios*.
- `activity-sdg-justification`: a stored justification for each SDG of an activity.
- `activity-sources`: catalogue of sources, licence and attribution on activities.
- `activity-import-mapping`: how the sheet columns map to these fields.

### Modified Capabilities

- `admin-activities` and `user-generated-activities`: the editor fields (delta described in the new capabilities; no existing requirement is removed).

## Impact

- **Depends on `progress-matrix-objectives`** (Matriz tables, `DivisionPill`, `ObjectivePill`). Where this change differs, it amends that change: activity-objective links gain `age_group` and `observable_behaviour`; `verifyActivityGoals` checks each (goal, division) pair; there are no objectives for `leaders`, so a `leaders` row is rejected and an old "Dirigentes (referência…)" block is dropped on import. Apply `progress-matrix-objectives` first, then this change.
- Schema (additive, migration to be generated and reviewed): new columns on `activities` and `activity_sdgs`, new columns on `activity_educational_goals` (PK becomes activity, goal, division, backfilled), new tables `activity_sources` and `activity_challenges`.
- API: activity read/write payloads, `/api/activities/[id]`, admin and proposal routes, new `/api/taxonomies/activity-sources` and `/api/taxonomies/challenges`.
- UI: `ActivityDetail`, `ActivityEditorForm`, `ActivityCard` (small safety/objective cues), program entry views (objectives per division), exports.
- Overlaps with `baseline-activity-load` and `admin-activity-excel-import` (both not archived): their column mapping tasks are revised here.
- Reuses the brand design system (tokens, `DivisionPill`, cards, callouts); adds no colour values.

## Resolved and open inputs

Resolved from the sample sheet: the column names, the instruction headings, the "Nível: texto" shape of risk cells, the "Divisão:\n• código texto" shape of objective cells, "ODS n: texto" justifications, and *desafio* codes (`EVAS-B`, `CC-A`, `VE-O`) that equal the Matriz codes already in the dataset.

Still needed from you or the content team:

- Is the risk analysis **mandatory** before an activity can be approved, or optional with an "incomplete" marker? (Proposed: optional, marked incomplete.)
- Cells such as "Baixo a médio: …" are ranges. Proposed: store the higher level and keep the text; confirm.
- Should *desafios* be limited to the activity's divisions? The sample links a Lobitos game to an Escoteiros and a Caminheiros *desafio*. Proposed: allow, but show each *desafio*'s own division.
- Are the sources' licences (some "© … All rights reserved") compatible with showing full activity text publicly, or must some show only a link?

## Context

**Source of the example.** The sheet `atividades_v2` (61 columns). The first data row, "Jogo da bandeira (exemplo)", is the layout example the product owner asked for; the second row ("1,2,3 Gesto", all five divisions) shows the multi-division case. Columns used: `Fonte`, `Nome`, `Descrição`, `Instruções`, `Materiais`, `Mins`, `Grupo`, `Esforço físico`, `Local`, `Tipo`, `Divisão`, `Risco físico`, `Risco psicológico`, `Mitigação física`, `Mitigação psicológica`, `Objetivos educativos (por divisão)`, `Comportamentos a observar (objetivos)`, `ODS`, `Justificação dos ODS`, `Desafios`, `Imagem URL`, plus `link_fonte`. The remaining columns (`Publicada`, `atividade_id`, `bruto_ids`, `duracao_min/max`, `variantes`, `campos_inferidos`, `confianca`, `estado`, `revisor`) are editorial workflow metadata and out of scope. Supporting tabs: `fontes` (source id, link, licence, access, language), `valores` (accepted values), `ods`, `desafios`, `objetivos educativos`.

**What the example contains** (shapes the import must parse):

- Instructions: three headed sections, numbered steps (`Preparação` / `Desenvolvimento` + `1.`…`5.` / `Fecho e debriefing`).
- Risk: `Médio: corridas e apanhadas com risco de colisões…` (level, colon, text). A range appears in row 2: `Baixo a médio: …`.
- Mitigation: free text per risk.
- Objectives: `Lobitos:\n• 4E.1.1 Participar em momentos de partilha\n• 4S.2.1 …`, one block per division; leaders: `Dirigentes (referência: objetivos de Caminheiros):`.
- Behaviours: same block shape with `• 4E.1.1: aceita fazer parte da equipa…` (text differs per division even for the same shared code, e.g. `5I.3-4` for Exploradores and Caminheiros).
- SDGs: `3 Saúde de Qualidade\n17 Parcerias…`; justification `ODS 3: …\nODS 17: …`.
- *Desafios*: `EVAS-B - Participa em 3 jogos…\nCC-A - Partilha algo…` (codes already in the Matriz dataset).

**Current state.** `activities` has name, description, materials, instructions (max 5000), duration, effort, image, approval; categories are many-to-many; `activity_educational_goals (activity_id, goal_id)`; `activity_sdgs (activity_id, sdg_id)`. The detail page shows header facts, materials, instructions, reviews, and a collapsed block with goals and SDGs.

## Goals / Non-Goals

**Goals:**

- Store everything above in structured fields, not in one text blob.
- A detail page where **safety information is never hidden** and objectives are readable per division with how to observe them.
- A proposal for the UI that can be reviewed before building (this document and `ui-proposal.html`).
- A sheet import that maps the new columns and reports what it could not map.

**Non-Goals:**

- Editorial workflow (draft/review states, confidence, reviewer, inferred-fields log).
- Duration ranges (`duracao_min/max`) and activity variants.
- Search over the new text fields.
- Rich text or markdown (the instruction convention is plain text).
- Automatic generation or checking of risks, objectives or behaviours.
- Translating catalogue content (stays Portuguese).

## Decisions

**D1. Risk analysis is six columns on `activities`.**
`physical_risk_level`, `psychological_risk_level` (`low | medium | high`, nullable), `physical_risk`, `psychological_risk`, `physical_mitigation`, `psychological_mitigation` (text, nullable). One analysis per activity, two dimensions, so columns beat a child table. Import splits `Médio: texto` at the first colon: level from the word, the rest as text; a range ("Baixo a médio") stores the **higher** level and keeps the original wording in the text so nothing is lost. Existing activities have no analysis and stay valid.
*Alternative:* a `risks` table with a free number of risks per activity. Rejected: the sheet has exactly one physical and one psychological risk with one mitigation each; a list can be added later without breaking this.

**D2. Objectives are linked per division and carry the behaviour.**
`activity_educational_goals` becomes `(activity_id, goal_id, age_group, observable_behaviour)` with primary key (activity, goal, age_group). A shared "3-4" objective can be linked twice with different behaviours (the sample does this). A `leaders` row must reference an objective of `rovers` (the sheet writes "referência: Caminheiros"); every other row's objective must belong to that same division. This replaces the rule in `progress-matrix-objectives` ("belongs to at least one of the activity's age groups") with the stricter per-row rule, and `ObjectivePill` draws exactly one pill per row. Migration backfills one row per (existing link × activity age group the objective belongs to), behaviour null.
Payload: `objectives: [{ goal_id, age_group, behaviour? }]`; the old `educational_goal_ids` stays accepted and expands to rows for every shared division, with no behaviour. Catalogue filtering by objective is unchanged (distinct activities).
*Alternative:* a separate `activity_objective_behaviours` table keyed like this. Rejected: it duplicates the link and invites orphaned behaviours.

**D3. SDG justification lives on the link.** `activity_sdgs.justification` (text, nullable). Import parses `ODS n: texto` lines by number; a justification for an SDG that is not linked is reported and dropped.

**D4. *Desafios* are linked through `activity_challenges (activity_id, challenge_id)`.** The picker lists the Matriz *desafios* grouped by type, each with its own division. No restriction by the activity's divisions (the sheet links across divisions); the detail page shows the *desafio*'s division so a mismatch is visible. Import resolves `CODE - text` by code; a code that does not exist is reported.

**D5. Sources are a small catalogue.** `activity_sources (id, code, name, url, license, access, language, is_managed)` loaded from the `fontes` tab through the same reference-data loader pattern as the Matriz (committed JSON, idempotent). `activities.source_id` (nullable) and `activities.source_url` (nullable). The page shows "Fonte: name ↗" and, when the licence needs it, the licence line. Activities without a source show nothing (user proposals).

**D6. Instructions stay one text field, rendered with structure.**
`parseInstructions(text)` recognises section headings (a line that is exactly `Preparação`, `Desenvolvimento` or `Fecho e debriefing`, case and accent insensitive) and numbered steps (`1.` at line start). Output: sections with a title and blocks (paragraph or ordered list). Text with no recognised heading renders as before (paragraphs). No migration and no length change. The editor shows a three-heading template as the placeholder.
*Alternative:* three columns (`preparation`, `steps`, `debriefing`). Rejected for now: the existing field, edit suggestions and exports already use one text, and the convention is lossless to import.

**D7. Reading order and visibility (UI proposal).** The page follows what a leader needs, in order: what it is → what I need → how to run it → how to keep it safe → what it develops → why it matters → source. **Safety is a first-level section, expanded, never inside a collapsed group.** Educational content (objectives, SDGs, *desafios*) sits below, each as its own section; on phones the three are collapsible.

```
DESKTOP (>= 1024 px, one column)                  PHONE (390 px)
┌──────────────────────────────────────────┐      ┌────────────────────────┐
│ [image 4:3]   Jogo                       │      │ [image]                │
│               JOGO DA BANDEIRA           │      │ Jogo da bandeira       │
│               Fonte: OSM ↗ · licença     │      │ Fonte: OSM ↗ · licença │
│               ⏱30min 👥Médio ↗Baixo ⌂Ext │      │ ⏱ 30  👥 Médio  ↗ Baixo │
│               [Lobitos]                  │      │ [Lobitos]              │
│               [+ Programa] [Sugerir]     │      │ [+ Programa] [Sugerir] │
├──────────────────────────────────────────┤      ├────────────────────────┤
│ Em resumo                                │      │ Em resumo              │
│ Materiais                                │      │ Materiais              │
│ COMO SE FAZ                              │      │ COMO SE FAZ  (open)    │
│  Preparação                              │      │ SEGURANÇA   (open)     │
│  Desenvolvimento 1..5                    │      │  Risco físico  [Médio] │
│  Fecho e debriefing                      │      │   o que pode correr mal│
│ SEGURANÇA                                │      │   como reduzir         │
│ ┌Risco físico──────┬Risco psicológico───┐│      │  Risco psicológico     │
│ │[Médio]           │[Baixo]             ││      │ OBJETIVOS ▸ (closed)   │
│ │o que pode correr │o que pode correr   ││      │ ODS ▸  DESAFIOS ▸      │
│ │como reduzir      │como reduzir        ││      │ Avaliações             │
│ OBJETIVOS E COMO OBSERVAR                │      └────────────────────────┘
│  [Lobitos|Escoteiros|…]                  │
│   4E.1.1 título                          │
│    Como observar: …                      │
│ ODS e porquê  (imagem ODS + justificação)│
│ DESAFIOS                                 │
│ Avaliações                               │
└──────────────────────────────────────────┘
```

Key UI decisions:

- **Risk cards side by side** (stacked on phones), each with a level badge that uses text and a bar icon (1 to 3 bars), never colour alone: Baixo = outline, Médio = Azul tint, Alto = destructive. Under each level: "O que pode correr mal" then "Como reduzir", so the mitigation is read next to the risk it answers. When no analysis exists the section says so and tells the leader to do their own risk assessment; admins see an "incompleta" marker in the list.
- **Objectives by division**: a tab strip of `DivisionPill`s (the division colour with its name) when the activity has more than one division, otherwise a plain heading. Each objective row: code pill, Matriz text, then "Como observar:" with the behaviour. Leaders' tab shows "Referência: objetivos de Caminheiros".
- **SDGs**: the official SDG image we already ship (`/sdg-icons/sdg-N.png`, the `icon_url` of each SDG) instead of a number tile, with the name, then the justification as a short paragraph (two columns on desktop). The image has a text alternative with the SDG number and name.
- **Everything about the activity's identity appears once, at the top**: key facts, divisions, the two actions (add to program, suggest an edit) and the source with its licence line. There is no side column and nothing is repeated further down; the page is one reading column, capped at a comfortable line length on wide screens.
- ***Desafios***: grouped by type; code chip, the *desafio*'s division pill, text. A short note says they are optional ways to recognise progress.
- Reuse brand design system patterns: cards with teal top rule, eyebrow labels, Azul AEP links, focus rings, 44 px targets, no new colours.
- Print/PDF: the same order, safety before objectives.

Open UI questions for review: tabs versus stacked divisions on desktop when there are five divisions; whether safety should also appear as a one-line badge on the catalogue card.

**D8. Editor.** Steps, not one long form: (1) basics and source, (2) instructions with the heading template, (3) safety (two columns, level select + risk + mitigation), (4) divisions and objectives (for each selected division an objective picker from `progress-matrix-objectives` plus one textarea per chosen objective for the behaviour; a `leaders` block picks from rovers' objectives), (5) SDGs (a justification textarea appears for each chosen SDG), (6) *desafios*, image, review. Per-field help text explains the sheet conventions. Autosave of drafts is out of scope.

**D9. Import mapping** (`activity-import-mapping`): parse rules per column, strict reporting. Unknown objective codes, behaviour lines without a matching objective, justifications for SDGs not listed, and *desafio* codes not in the Matriz are reported, never silently dropped; the activity loads without them. The loader keeps refusing non-local databases by default and committing nothing from the sheet.

## Risks / Trade-offs

- **Heavier editor**: six steps is a lot for a proposal. Mitigation: only name, description, materials, duration, categories remain required; everything new is optional, and the detail page copes with any subset.
- **Safety content quality**: an empty or wrong mitigation is worse than none. The page never invents text, shows "análise de risco ainda não disponível" when missing, and keeps the leader's own responsibility explicit.
- **Per-division rows multiply data**: an activity for five divisions with three objectives each is 15 rows; acceptable, and the editor shows them per division.
- **Behaviour text per division for shared objectives**: stored as typed; the import keeps both.
- **Licence exposure**: showing full text from sources with restrictive licences may be a problem; the `license`/`access` fields are stored so the content team can decide per source (see open questions).
- **Dependency on `progress-matrix-objectives`**: this change cannot be applied first.

## Migration Plan

1. After `progress-matrix-objectives`: edit the schema, `npm run db:generate` (ask first), review the SQL (additive columns and tables; the primary key of `activity_educational_goals` changes with a backfill) and commit.
2. Local: `db:migrate`, run the reference loader (sources), then re-run the local re-link script so demo activities carry per-division rows and sample behaviours.
3. Preview, then Production; no content is rewritten.
4. Rollback: new columns and tables are nullable/additive; the old primary key can be restored from the backfilled data (one row per goal) with a down script written during review.

## Open Questions

See "Resolved and open inputs" in the proposal. Additionally: should the catalogue card show a risk badge, and should proposals by users require at least a risk level before approval?

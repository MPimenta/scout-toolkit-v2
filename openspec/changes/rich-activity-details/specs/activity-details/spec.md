## Purpose

The activity detail page: what it shows, in what order, and how it behaves on phone and desktop, so a leader can prepare and run an activity safely and justify it educationally.

## ADDED Requirements

### Requirement: Reading order

The detail page SHALL present its content in this order: header (image, type, title, source and licence line, key facts, divisions, actions), summary (description), materials, instructions, safety, objectives and how to observe them, SDGs and their justification, *desafios*, reviews. Key facts, divisions, actions and the source with its licence SHALL appear only in the header and SHALL NOT be repeated elsewhere on the page. A section with no content SHALL be omitted, except safety (see `activity-risk-analysis`).

#### Scenario: Full activity

- **GIVEN** an activity with every field filled
- **WHEN** the page renders
- **THEN** the sections appear in the order above

#### Scenario: Sparse activity

- **GIVEN** an activity with only name, description, materials and duration
- **WHEN** the page renders
- **THEN** no empty section headings appear, and the safety section shows its "not available" notice

### Requirement: Key facts

The header SHALL show duration, group sizes, physical effort and location (every selected value of each), the divisions as `DivisionPill`s carrying the division name, and the activity types. Source name SHALL appear next to the type when the activity has one.

#### Scenario: Multi-valued facts

- **GIVEN** an activity for two group sizes and two divisions
- **WHEN** the header renders
- **THEN** both sizes and both division pills are shown

### Requirement: Instructions are rendered with their structure

Instructions SHALL be rendered by recognising the headings `Preparação`, `Desenvolvimento` and `Fecho e debriefing` (a line containing only that text, ignoring case and accents) as section titles and lines starting with `n.` as an ordered list. Text without a recognised heading SHALL render as plain paragraphs. The stored text SHALL NOT be altered.

#### Scenario: Structured instructions

- **GIVEN** instructions with the three headings and five numbered steps
- **WHEN** the page renders
- **THEN** it shows three titled sections and an ordered list of five steps under Desenvolvimento

#### Scenario: Plain instructions

- **GIVEN** instructions without any recognised heading
- **WHEN** the page renders
- **THEN** the text appears as paragraphs exactly as stored

### Requirement: Responsive layout

The page SHALL be a single reading column at every width, with its content width capped at about 900 px on wide screens, controls at least 44 px high and no horizontal scroll. From 1024 px the two risk cards SHALL sit side by side; below it they SHALL stack. There SHALL be no side column. On phones the sections objectives, SDGs and *desafios* MAY be collapsed by default; instructions and safety SHALL be expanded.

#### Scenario: Phone

- **WHEN** the page renders at 390 px
- **THEN** it is a single column, instructions and safety are open, and objectives, SDGs and *desafios* are collapsible

#### Scenario: Desktop

- **WHEN** the page renders at 1440 px
- **THEN** the content is one column capped in width, there is no side column, and the two risk cards sit side by side

### Requirement: Visual language

The page SHALL use the design system: cards with hairline border and teal top rule, eyebrow labels, Azul AEP links, tokens for every colour, division colours only through `DivisionPill`, focus rings and 4 px radius. Information SHALL NOT depend on colour alone.

#### Scenario: Division colours

- **WHEN** a division appears on the page
- **THEN** it is shown by a `DivisionPill` with the division name as text

### Requirement: Print and export order

Printing the page and exporting an activity (program PDF/Excel) SHALL keep safety before objectives and include the new fields.

#### Scenario: Program PDF

- **WHEN** a program with an activity that has risks and objectives is exported
- **THEN** the activity block lists instructions, risks with mitigations, then objectives with behaviours

## Purpose

Educational objectives linked to an activity per division, each with the behaviours that show it was reached, and links from the activity to Matriz *desafios*. Builds on `progress-matrix-objectives`.

## ADDED Requirements

### Requirement: Objectives are linked per division with an observable behaviour

An activity SHALL link objectives as rows of (objective, division, optional observable behaviour). The same objective MAY appear for several divisions with different behaviours. Each row's objective SHALL belong to its division, except that a `leaders` row SHALL reference an objective of one of the activity's other divisions (the sheet writes "referência: Caminheiros" or "referência: Exploradores"). A row whose division is not one of the activity's divisions SHALL be rejected. The behaviour text SHALL be limited to 1000 characters.

#### Scenario: Shared objective, two behaviours

- **GIVEN** an activity for `adventurers` and `rovers`
- **WHEN** it is saved with objective `5I.3-4` for `adventurers` ("propõe ao par um sistema de gestos") and for `rovers` ("cria e adapta gestos com o par")
- **THEN** two rows are stored, each with its own behaviour

#### Scenario: Objective of another division

- **GIVEN** an activity for `scouts` only
- **WHEN** it is saved with objective `1A.1` for `scouts`
- **THEN** the API returns 400 naming `1A.1` and stores nothing

#### Scenario: Leaders reference rovers

- **GIVEN** an activity for `rovers` and `leaders`
- **WHEN** it is saved with `4A.4` for `leaders`
- **THEN** the row is accepted because `4A.4` belongs to `rovers`

#### Scenario: Division not on the activity

- **GIVEN** an activity for `scouts`
- **WHEN** a row for `rovers` is submitted
- **THEN** the API returns 400

### Requirement: Backward-compatible shorthand

The API SHALL keep accepting `educational_goal_ids` and expand each id to one row per division the objective shares with the activity, without behaviour. When both `objectives` and `educational_goal_ids` are sent, `objectives` SHALL win.

#### Scenario: Old payload

- **WHEN** an existing client sends `educational_goal_ids` for objective `1A.2` on a `scouts` activity
- **THEN** one row (`1A.2`, `scouts`, no behaviour) is stored

### Requirement: Objectives section on the detail page

The detail page SHALL show objectives grouped by division. With more than one division it SHALL use a tab strip of `DivisionPill`s (division colour and name); with one division, a heading. Each objective SHALL show its code pill, its Matriz text and, when present, "Como observar:" followed by the behaviour. The `leaders` group SHALL state that it references the objectives of the other divisions of the activity.

#### Scenario: Two divisions

- **GIVEN** an activity for Lobitos and Escoteiros with objectives and behaviours
- **WHEN** the section renders
- **THEN** two tabs are shown; the first lists Lobitos objectives with their behaviours

#### Scenario: Missing behaviour

- **GIVEN** an objective row without behaviour
- **WHEN** it renders
- **THEN** it shows the objective and no "Como observar" line

### Requirement: Links to Matriz desafios

An activity SHALL be linkable to any number of Matriz *desafios*. The detail page SHALL list them grouped by type, each with its code, its own division as a `DivisionPill` and its text, and a note that *desafios* are optional ways to recognise progress. No restriction SHALL tie a *desafio* to the activity's divisions.

#### Scenario: Cross-division desafio

- **GIVEN** a Lobitos activity linked to `EVAS-B` (Escoteiros band)
- **WHEN** the page renders
- **THEN** the *desafio* appears with an Escoteiros pill

#### Scenario: Unknown desafio

- **WHEN** a write references a *desafio* id that does not exist
- **THEN** the API returns 400 and stores nothing

### Requirement: Editor per division

The editor SHALL, for each selected division, show an objective picker (objectives of that division; for `leaders`, those of the activity's other divisions) and a behaviour textarea for each chosen objective. Deselecting a division SHALL remove its rows and tell the user which were removed.

#### Scenario: Dropping a division

- **GIVEN** an activity with Escoteiros and Exploradores rows
- **WHEN** the leader deselects Exploradores
- **THEN** the Exploradores rows are removed and a message names their codes

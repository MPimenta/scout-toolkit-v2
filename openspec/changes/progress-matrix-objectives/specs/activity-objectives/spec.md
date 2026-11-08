## Purpose

Defines how activities are matched against the Matriz's age-specific objectives, and how objectives are shown with the colour of their age group so leaders see the intended section at a glance.

## ADDED Requirements

### Requirement: Activities link to age-specific objectives

An activity SHALL be linkable to any number of specific objectives. Every linked objective SHALL belong to at least one of the activity's age groups. A write that links an objective outside the activity's age groups SHALL be rejected with a Portuguese validation error that names the objectives, and SHALL store nothing.

#### Scenario: Matching objective

- **GIVEN** an activity for `scouts`
- **WHEN** it is saved with objective `1A.2`
- **THEN** the objective is linked

#### Scenario: Objective of another age group

- **GIVEN** an activity for `scouts` only
- **WHEN** it is saved with objective `1A.1` (which belongs to `cub_scouts`)
- **THEN** the API returns 400, names `1A.1`, and the activity is unchanged

#### Scenario: Several age groups, several objectives

- **GIVEN** an activity for `scouts` and `adventurers`
- **WHEN** it is saved with `1A.2`, `1A.3` and the shared `3A.3-4`
- **THEN** all three are linked

#### Scenario: Removing an age group

- **GIVEN** an activity for `scouts` and `adventurers` linked to `1A.2` and `1A.3`
- **WHEN** it is saved for `scouts` only while still linked to `1A.3`
- **THEN** the API returns 400 and names `1A.3`

### Requirement: Editor offers only matching objectives

The activity editor SHALL list objectives only for the age groups currently selected, grouped by area and general objective, each shown with its code. When no age group is selected it SHALL show a hint to choose one first. When the selection of age groups changes, objectives that no longer match SHALL be deselected and the user told which ones.

#### Scenario: Choosing an age group

- **WHEN** a leader selects only Escoteiros
- **THEN** only objectives whose age groups include `scouts` are offered

#### Scenario: Dropping an age group

- **GIVEN** an activity with Escoteiros and Exploradores and objective `1A.3` selected
- **WHEN** the leader deselects Exploradores
- **THEN** `1A.3` is deselected and a message says so

### Requirement: Objective filter follows the age-group filter

The catalogue filter SHALL offer objectives for the selected age groups (all objectives when none is selected). An activity matches when it is linked to any selected objective; this combines with the other filters using AND. Deselecting an age group SHALL drop selected objectives that no longer apply.

#### Scenario: Filter by objective

- **WHEN** a user filters by objective `4F.3.2`
- **THEN** only activities linked to `4F.3.2` are listed, once each

### Requirement: Objective pills use the age-group colour

Wherever an objective is shown as a pill (activity card, activity detail, filters, program views), the pill SHALL use the colour token of its age group, show the objective code, and expose the age-group name in its accessible name. Colour SHALL NOT be the only cue. For an activity, an objective that belongs to several of the activity's age groups SHALL appear once per matching age group. The card SHALL show the first three pills plus a "+k" count.

#### Scenario: Pill colour

- **WHEN** an activity linked to `1A.2` is shown
- **THEN** the pill for `1A.2` uses the Escoteiros colour and its accessible name includes "Escoteiros"

#### Scenario: Shared objective on a two-age-group activity

- **GIVEN** an activity for `adventurers` and `rovers` linked to `3A.3-4`
- **WHEN** the detail view renders
- **THEN** it shows one pill in the Exploradores colour and one in the Clã colour

#### Scenario: Shared objective on a one-age-group activity

- **GIVEN** an activity for `rovers` only linked to `3A.3-4`
- **WHEN** the detail view renders
- **THEN** it shows one pill, in the Clã colour

#### Scenario: Program summary

- **GIVEN** a program with an Exploradores activity and a Clã activity, both linked to `3A.3-4`
- **WHEN** the program summary renders
- **THEN** `3A.3-4` appears once per division the program uses it for (one Exploradores pill, one Clã pill), not once per activity

#### Scenario: Contrast

- **WHEN** a pill renders in light or dark mode
- **THEN** its text meets WCAG 2.1 AA contrast against its background

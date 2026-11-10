# catalogue-filters Specification

## Purpose
The structure and behaviour of the catalogue filter panel: divisions as pills, fact filters with the shared icons, a duration range, format and focus filters and grouped objectives, active-filter chips, and the same panel in the phone sheet.

## Requirements

### Requirement: Divisions are toggle pills

The age-group filter SHALL be a row of toggle pills, one per division, using the division colour tokens through the shared division pill. Each pill SHALL show the division wording already used in the UI, SHALL expose `aria-pressed`, SHALL have a hit area of at least 44 px, and SHALL be operable with the keyboard. A selected pill SHALL show the division fill and label colour plus a check icon; an unselected pill SHALL be an outlined pill with a bordered colour swatch. The selected state SHALL NOT rely on colour alone.

#### Scenario: Selecting a division

- **WHEN** a user presses the Escoteiros pill
- **THEN** it becomes filled in the Escoteiros colour with a check icon, `aria-pressed` is true, and only activities for Escoteiros are listed

#### Scenario: Several divisions

- **WHEN** a user also presses Exploradores
- **THEN** activities for either division are listed (OR within the group)

#### Scenario: Contrast

- **WHEN** a pill is rendered in the light or dark theme
- **THEN** its label meets WCAG 2.1 AA against its fill, and the unselected swatch has a visible border

### Requirement: Fact filters use the shared icons

The group-size, effort and location filters SHALL each start with their fact icon and heading and SHALL keep checkbox options. The same icons SHALL appear on the matching active-filter chips.

#### Scenario: Headings

- **WHEN** the filter panel is expanded
- **THEN** Grupo shows Users, Esforço shows Target and Local shows MapPin

### Requirement: Duration is a range

The duration filter SHALL be a stepped two-handle slider over the stops 5, 10, 15, 20, 30, 45, 60, 90 and 120+ minutes (the last stop meaning no upper limit), together with a minimum and a maximum minutes field kept in sync with it, and a readout. Both bounds SHALL be inclusive and either MAY be open. The filter SHALL NOT offer an operator. When both handles are at the ends of the scale the filter SHALL be off and show no chip.

#### Scenario: Range

- **WHEN** a user sets 15 to 45 minutes
- **THEN** the readout says "15–45 min", the chip shows the same, and only activities lasting 15 to 45 minutes (inclusive) are listed

#### Scenario: One open bound

- **WHEN** a user sets only a maximum of 30
- **THEN** the readout says "≤30 min" and activities of 30 minutes or less are listed

#### Scenario: Typed value between stops

- **WHEN** a user types 25 as the minimum
- **THEN** the request uses 25 and the slider handle shows the nearest stop

#### Scenario: Invalid range

- **WHEN** the minimum is greater than the maximum
- **THEN** an inline message explains it and the filter is not applied

#### Scenario: Keyboard

- **WHEN** a handle has focus and the user presses the arrow keys
- **THEN** it moves one stop and the readout and fields update

### Requirement: Duration API

`GET /api/activities` SHALL treat `duration_min` and `duration_max` as inclusive bounds, either of which MAY be omitted, and SHALL ignore `duration_operator`. The catalogue UI SHALL NOT send `duration_operator`.

#### Scenario: Both bounds

- **WHEN** a request has `duration_min=15` and `duration_max=45`
- **THEN** activities of 15, 20, 45 minutes are returned and one of 10 or 60 minutes is not

#### Scenario: Legacy operator

- **WHEN** a request carries `duration_operator=>` with `duration_min=30`
- **THEN** the operator is ignored and activities of 30 minutes are included

### Requirement: Format and focus are separate filters

The filter panel SHALL offer the activity format and the activity focus as two separate sections (the former activity types are no longer offered), SHALL show each value's count of approved activities, SHALL hide values with no approved activity and SHALL show each value's description as the option title. Without the metadata it SHALL show a flat list. How the filters match is defined by the format and focus filters of the reference sheet (a focus matches the main or the secondary focus).

#### Scenario: Two sections

- **WHEN** the filter panel is expanded
- **THEN** Jogo appears under Formato with its count and Cooperação under Foco with its count

#### Scenario: Empty value hidden

- **GIVEN** no approved activity uses the format Aventura/Percurso
- **WHEN** the filter panel is expanded
- **THEN** Aventura/Percurso is not listed

### Requirement: Objectives are a grouped tree

The educational-objectives filter SHALL be a tree of area, general objective and specific objective, each node collapsible, with a search field, a count of available objectives per group and a count of selected ones, and a strip of removable chips for the current selection. A node SHALL be off, on or partial. Selecting a node SHALL select every objective under it and clear any selection below it; deselecting it SHALL clear it; a parent with a selected descendant and not selected itself SHALL show the partial state. Groups with a selection SHALL start open and the others closed. Specific objectives SHALL show their code in the division-coloured pill followed by the Matriz text.

#### Scenario: Selecting an area

- **WHEN** a user selects the area Físico
- **THEN** the area is on, a chip "Físico" appears, and activities linked to any Físico objective are listed

#### Scenario: Selecting a leaf under a selected area

- **GIVEN** the area Físico is on
- **WHEN** the user opens it and selects objective 4F.3.2
- **THEN** the area selection is replaced by the objective (the area now shows partial) and a chip "4F.3.2" appears

#### Scenario: Partial parent

- **WHEN** one objective of general objective 4S is selected
- **THEN** 4S and its area show the partial state

#### Scenario: Search

- **WHEN** a user types "liderar"
- **THEN** only matching objectives are shown, their groups are open, and the match is highlighted

#### Scenario: Pills

- **WHEN** an objective that belongs to Exploradores and Clã is listed
- **THEN** it shows an Exploradores pill and a Clã pill with its code

### Requirement: Objectives follow the division filter

When divisions are selected the objective tree SHALL list only objectives of those divisions, with counts for those divisions. Deselecting a division SHALL drop selected specific objectives that no longer apply and SHALL keep selected areas and general objectives.

#### Scenario: Division limits the tree

- **WHEN** only Escoteiros is selected
- **THEN** each area lists only Escoteiros objectives and counts them

#### Scenario: Dropping a division

- **GIVEN** Escoteiros and Exploradores are selected with objective 4F.1.3 (Exploradores) chosen
- **WHEN** Exploradores is deselected
- **THEN** 4F.1.3 is removed from the selection and a selected area is kept

### Requirement: Objective API parameters

`GET /api/activities` SHALL accept comma-separated `educational_areas`, `general_objectives` and `educational_goals` parameters and SHALL return activities linked to any objective that matches at least one of them, each activity once, combined with every other filter by AND. Invalid ids SHALL be rejected with a Portuguese validation error.

#### Scenario: Area parameter

- **WHEN** a request has `educational_areas` for Físico
- **THEN** activities linked to any Físico objective are returned once each

#### Scenario: Union

- **WHEN** a request has `educational_areas` for Físico and `educational_goals` for 4S.1.2
- **THEN** activities linked to either are returned

### Requirement: Active filters are shown with the same icons

The active-filter summary SHALL show one removable chip per active filter: division chips as division pills, fact chips with the fact icon, a duration chip with the readout, format and focus chips with their name, and objective chips with the code pill or the area or general-objective name. A "Limpar" control SHALL clear every filter.

#### Scenario: Removing a chip

- **WHEN** a user removes the duration chip
- **THEN** the duration returns to the full range and the list updates

### Requirement: Phone sheet shows the same panel

At viewports under 768 px the filters SHALL open in a sheet with the same sections in one column, a sticky search field, sticky "Limpar" and "Ver N atividades" actions, one open objective area at a time, and controls of at least 44 px. The page SHALL NOT scroll horizontally.

#### Scenario: Phone

- **WHEN** a phone-width user opens the filters
- **THEN** they can select a division, set a duration, pick an objective and apply, without horizontal scroll

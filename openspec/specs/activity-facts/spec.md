# activity-facts Specification

## Purpose
One icon per kind of activity fact (duration, group size, effort, location) and one component to show it, so a fact looks the same on the detail page, the cards, the table and the filters.

## Requirements

### Requirement: One icon per fact kind

The application SHALL use exactly one icon for each fact kind: Clock for duration, Users for group size, Target for physical effort and MapPin for location. These icons SHALL come from a single shared definition and SHALL NOT be replaced by another icon on any screen.

#### Scenario: Detail and card agree

- **WHEN** the activity detail header and an activity card show the same activity
- **THEN** both show duration with Clock, group size with Users, effort with Target and location with MapPin

#### Scenario: A different icon sneaks in

- **WHEN** a component uses another icon (for example a trending arrow) for one of these facts
- **THEN** the automated check fails and names the file

### Requirement: Shared component

A shared `Fact` component SHALL render an icon followed by its text label, and a shared `FactIcon` SHALL render the icon alone for section headings and chips. Icons SHALL be hidden from assistive technology; the text label SHALL always be present or provided as the accessible name.

#### Scenario: Label present

- **WHEN** a fact is rendered
- **THEN** its value is readable as text and the icon is `aria-hidden`

### Requirement: Where facts are shown

The shared icons SHALL be used by the activity detail header, the activity card, the activities table (headers and cells), the catalogue filter (section headings and active-filter chips) and the program entry views. Age groups SHALL NOT use a fact icon; they are shown as division pills.

#### Scenario: Filter headings

- **WHEN** the filter panel is open
- **THEN** the Grupo, Esforço, Local and Duração sections each start with their fact icon

#### Scenario: Active chip

- **GIVEN** the Exterior location filter is on
- **WHEN** the active-filter chips render
- **THEN** the chip shows MapPin and the text "Exterior"

### Requirement: Divisions on cards are coloured pills

The activity card SHALL show the activity's divisions as division pills, one per division, in the fixed order Alcateia, Escoteiros, Exploradores, Clã, Chefia, on one wrapping row. Each pill SHALL show a compact division name (Lobitos, Escoteiros, Exploradores, Caminheiros, Dirigentes), SHALL carry the full division wording with ages as its accessible name and title, and SHALL use the division colour tokens through the shared division pill. The card SHALL NOT show a text list of divisions or a fact icon for them, and SHALL show every division of the activity (no truncation).

#### Scenario: Several divisions

- **GIVEN** an activity for Lobitos and Escoteiros
- **WHEN** its card renders
- **THEN** it shows a yellow "Lobitos" pill and a green "Escoteiros" pill whose accessible names are "Alcateia: Lobitos (6-10)" style labels with the ages

#### Scenario: All five divisions

- **GIVEN** an activity for every division
- **WHEN** its card renders
- **THEN** five pills are shown, wrapping onto a second line if needed, and no "+k" count

#### Scenario: Objective pills are different

- **GIVEN** a card that shows division pills and objective pills
- **WHEN** both render
- **THEN** division pills show names and objective pills show codes, each in its division colour

### Requirement: Icon appearance

Fact icons SHALL be 16 px, use the secondary text token for colour, and align with the text baseline. Icons SHALL NOT carry meaning that the text does not.

#### Scenario: Dark theme

- **WHEN** the dark theme is active
- **THEN** the icons keep at least 3:1 contrast against their background

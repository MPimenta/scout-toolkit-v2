## ADDED Requirements

### Requirement: Add-activity dialog filters by format and focus

The add-activity dialog of the program builder SHALL offer a format filter and a focus filter, each listing the values present in the activities it shows with "Todos" first, instead of an activity-type filter. The focus filter SHALL match an activity whose main or secondary focus is the chosen one. The dialog SHALL keep its free-text search, matching the activity title, description and instructions (case and accent insensitive), and the filters SHALL combine with the search and with each other.

#### Scenario: Filter by format

- **GIVEN** the dialog lists activities of the formats Jogo and Quebra-gelo
- **WHEN** the leader picks Jogo
- **THEN** only activities with the format Jogo are listed

#### Scenario: Focus matches the secondary focus

- **GIVEN** an activity with the main focus Confiança and the secondary focus Comunicação
- **WHEN** the leader picks the focus Comunicação
- **THEN** that activity is listed

#### Scenario: Search covers instructions

- **GIVEN** an activity whose instructions mention "lenço" and whose title and description do not
- **WHEN** the leader searches for "lenco"
- **THEN** that activity is listed

#### Scenario: Sheet activities have options

- **GIVEN** the dialog lists only activities loaded from the reference sheet
- **WHEN** the dialog opens
- **THEN** the format and focus filters have options

### Requirement: Schedule rows show format and focus

A program schedule row for an activity SHALL show its format, main focus and secondary focus (in that order, those that exist) in the place where the activity type used to be shown, and nothing when it has none of them. The program API SHALL return `format`, `focus` and `secondary_focus` for each activity entry.

#### Scenario: Row details

- **GIVEN** a program entry for an activity with the format Jogo, the focus Cooperação and the secondary focus Liderança
- **WHEN** the leader opens the row details
- **THEN** it shows "Jogo · Cooperação · Liderança"

#### Scenario: Program API

- **WHEN** a client reads a program
- **THEN** each activity entry carries `format`, `focus` and `secondary_focus` (each `{ id, code, name }` or `null`)

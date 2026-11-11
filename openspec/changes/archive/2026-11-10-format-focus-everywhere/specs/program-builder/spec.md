## ADDED Requirements

### Requirement: Add-activity dialog filters by format and focus

The add-activity dialog of the program builder SHALL offer a format filter and a focus filter, each listing the formats or focuses of the reference data with "Todos" first, instead of an activity-type filter. The focus filter SHALL match an activity whose main or secondary focus is the chosen one. The dialog SHALL keep its free-text search, matching the activity title, description, materials and instructions (ignoring letter case). Search and filters SHALL be applied by the server over the whole catalogue and combine with each other, and results SHALL come a page at a time with a control to show more.

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

A program schedule row for an activity SHALL show its format and, next to it, its main and secondary focus, each only when it exists, in the place where the activity type used to be shown. The program API SHALL return `format`, `focus` and `secondary_focus` for each activity entry.

#### Scenario: Row details

- **GIVEN** a program entry for an activity with the format Jogo, the focus Cooperação and the secondary focus Liderança
- **WHEN** the leader opens the row details
- **THEN** it shows the format "Jogo" and the focus "Cooperação · Liderança"

#### Scenario: Program API

- **WHEN** a client reads a program
- **THEN** each activity entry carries `format`, `focus` and `secondary_focus` (each `{ id, code, name }` or `null`)


### Requirement: The program page shows every activity of its program

The program page SHALL show the details of each activity in the program (duration, groups, objectives, SDGs, format and focus) whichever activities the program holds and however large the catalogue is, by reading the program's own activities by id rather than the first page of the catalogue. An activity added in this session SHALL count in the schedule and the summary at once, before any refetch.

#### Scenario: Activity far down the catalogue

- **GIVEN** a catalogue of 1,080 activities and a program that holds one whose name sorts last
- **WHEN** the leader opens the program page
- **THEN** that activity shows its duration and details in the schedule and the summary

#### Scenario: Activity just added

- **WHEN** the leader adds an activity from the dialog
- **THEN** the schedule and the total duration include it immediately

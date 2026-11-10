# program-builder Specification

## Purpose

Keeps the signed-in program page schedule in sync with the last successful add or remove, so the leader sees the activity appear or disappear without reloading the page.

## Requirements

### Requirement: Added activity appears on the open program page

When a signed-in owner adds an activity to a program while that program page is open, the schedule SHALL show the new activity without a full page reload. The row SHALL use the activity name from the catalogue. The empty-state copy "Nenhuma entrada no programa ainda." SHALL no longer be the only schedule content.

#### Scenario: Add from the program page

- **GIVEN** the owner is on `/programs/:id` with an empty schedule
- **WHEN** they add a catalogue activity and the write succeeds
- **THEN** the schedule shows that activity by name
- **AND** the page does not require a manual refresh

#### Scenario: Add from an activity page then land on the program

- **GIVEN** the owner adds an activity to a program from the activity page
- **WHEN** they arrive on `/programs/:id`
- **THEN** the schedule shows the activity they just added

### Requirement: Removed activity disappears from the open program page

When a signed-in owner removes an activity from the open program page and the write succeeds, the schedule SHALL hide that activity without a full page reload. If no entries remain, the empty-state copy SHALL be visible.

#### Scenario: Remove from the program page

- **GIVEN** the owner is on `/programs/:id` and the schedule lists an activity
- **WHEN** they remove that activity and the write succeeds
- **THEN** the schedule no longer shows that activity
- **AND** the page does not require a manual refresh

### Requirement: Failed writes do not leave a false schedule

If an add or remove write fails, the schedule SHALL return to the last successful list. The owner SHALL still be on the program page.

#### Scenario: Add fails

- **GIVEN** the owner is on `/programs/:id`
- **WHEN** adding an activity fails
- **THEN** the schedule does not keep a row that was never saved

### Requirement: Schedule starts at the program start time

The first schedule entry SHALL start at the program's start time. Each later entry SHALL start when the previous one ends. An entry's length SHALL be the activity's approximate duration, or the custom block's duration. When the owner changes the program start time, or adds, removes, or reorders entries, every entry's start and end SHALL be recalculated and saved.

#### Scenario: Program starting at 09:30

- **GIVEN** a program with start time 09:30
- **WHEN** the owner adds a 90-minute activity and then a 15-minute custom block
- **THEN** the schedule shows 09:30–11:00 and 11:00–11:15

#### Scenario: Start time changed

- **GIVEN** that program
- **WHEN** the owner changes the start time to 10:00
- **THEN** the schedule shows 10:00–11:30 and 11:30–11:45

#### Scenario: Activity added from the activity page

- **GIVEN** a program starting at 09:30 that already ends at 11:15
- **WHEN** the owner adds a 30-minute activity from its activity page
- **THEN** the new entry is last and runs 11:15–11:45

### Requirement: One total duration everywhere

A program's total duration SHALL be the sum of its entry lengths. The programs list, the program page summary, the PDF and Excel exports, and the default end time in the Orgo dialog SHALL show the same total and end time.

#### Scenario: List and builder agree

- **GIVEN** a program with entries of 90, 15, and 15 minutes
- **WHEN** the owner views the programs list and the program page
- **THEN** both show a total of 2h

#### Scenario: Orgo default end

- **GIVEN** that program starts at 09:30 on 14/11/2026
- **WHEN** the owner opens the create-in-Orgo dialog
- **THEN** the end is prefilled as 14/11/2026 11:30

### Requirement: Server assigns entry positions

The server SHALL place a newly added entry at the end of the schedule unless the request names a valid position. Positions SHALL stay contiguous after adds, removes, and reorders. A client SHALL NOT be able to create two entries with the same position.

#### Scenario: Add to an empty program

- **GIVEN** a program with no entries
- **WHEN** the owner adds an activity without giving a position
- **THEN** the entry is saved as the first entry

#### Scenario: Remove from the middle

- **GIVEN** a program with three entries
- **WHEN** the owner removes the second
- **THEN** the remaining two are first and second, and their times are recalculated

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

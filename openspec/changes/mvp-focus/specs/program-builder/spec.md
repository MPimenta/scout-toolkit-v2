## ADDED Requirements

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

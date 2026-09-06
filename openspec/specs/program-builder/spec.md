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

## ADDED Requirements

### Requirement: Admin table shows format and focus

The admin activities table (columns, the mobile row and the CSV export) SHALL show the activity's format and main focus in place of the former activity-type column, and SHALL fall back to the former types in the format column for an activity with no format. The table SHALL stay sortable and searchable by the same text as before.

#### Scenario: Columns

- **GIVEN** an activity with the format Jogo and the focus Cooperação
- **WHEN** an admin opens the activities table
- **THEN** the row shows "Jogo" and "Cooperação" in the format and focus columns

#### Scenario: CSV

- **WHEN** an admin exports the table to CSV
- **THEN** the file has Formato and Foco columns in place of the type column

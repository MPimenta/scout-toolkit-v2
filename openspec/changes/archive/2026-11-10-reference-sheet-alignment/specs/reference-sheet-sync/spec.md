## Purpose

Makes the curated activities spreadsheet the definitive reference for the catalogue and defines how a snapshot of it is loaded: repeatably, safely and with a report of everything that could not be matched.

## ADDED Requirements

### Requirement: The sheet is the definitive reference
The system SHALL treat the curated spreadsheet as the definitive source of the catalogue's reference values (objectives, *desafios*, ODS, sources, focuses, formats, divisions, locations, effort, group sizes and risk levels) and of its activities. Where an earlier document or dataset differs, the sheet's value SHALL win. Objective codes and texts SHALL be the workbook's, including the shared and split codes (`2C.3-4`, `4F.2.3`, `4F.2.4`, `6C.2`, `6C.3`, `7C.3-4`).

#### Scenario: Objective codes match the sheet
- **WHEN** the reference data is loaded
- **THEN** the objectives have exactly the codes and texts of the sheet's objectives tab
- **AND** `2C.3-4` and `7C.3-4` each exist once, with both their age groups

### Requirement: Snapshot loader
The system SHALL load activities from an exported snapshot of the sheet (a file kept outside version control) with a command that supports a dry run. The loader SHALL refuse a non-local database unless explicitly overridden, and SHALL change nothing during a dry run.

#### Scenario: Dry run
- **WHEN** the loader runs with the dry-run option
- **THEN** it prints the report and writes no rows

#### Scenario: Hosted database refused
- **WHEN** `DATABASE_URL` points at a non-local host and no override is given
- **THEN** the loader exits with an error and writes nothing

### Requirement: Stable external id and idempotent upsert
Each activity in the sheet carries an id of the form `ATV-0001`. The system SHALL store it on the activity and SHALL use it as the upsert key: loading the same snapshot twice creates no duplicates and a second run changes nothing; a row whose id exists updates that activity. Activities created in the app have no external id and SHALL never be changed or removed by the loader.

#### Scenario: Second run
- **WHEN** the same snapshot is loaded twice
- **THEN** the second run reports every activity as unchanged

#### Scenario: Edited row
- **WHEN** a row's description changes between two snapshots
- **THEN** the activity with that id is updated and no new activity is created

#### Scenario: App-created activity untouched
- **WHEN** an activity was created in the app and has no external id
- **THEN** loading a snapshot leaves it as it is

### Requirement: Unknown values are reported, never guessed
When a cell holds a value the catalogue does not know (an unknown objective or *desafio* code, format, focus, risk level, division, ODS or source), the system SHALL drop that value, keep the rest of the row and list the value, the row and the column in the load report. It SHALL NOT create reference values from activity rows.

#### Scenario: Unknown objective code
- **WHEN** a row lists the objective code `9Z.9` that is not in the Matriz
- **THEN** the activity is loaded without that objective
- **AND** the report lists `9Z.9`, the activity id and the column

### Requirement: Dirigentes have no objectives
The system SHALL ignore the objective and observed-behaviour blocks written for Dirigentes (for example "Dirigentes (referência: objetivos de Caminheiros)") and SHALL NOT store objective links for the `leaders` division. Dirigentes remain a division an activity can be suitable for.

#### Scenario: Dirigentes block ignored
- **WHEN** a row has objectives for Lobitos and a "Dirigentes (referência: …)" block
- **THEN** only the Lobitos objectives are stored
- **AND** the activity is still marked suitable for Dirigentes if its division cell says so

### Requirement: Source priority
Each source SHALL carry the sheet's priority, and the loaded activity SHALL reference its source by the sheet's source id.

#### Scenario: Priority loaded
- **WHEN** the sources are loaded
- **THEN** each source has its code, licence, access, language and priority from the sheet's sources tab

### Requirement: Load report
Every run SHALL produce a report with the number of rows read, created, updated, unchanged and skipped (with reasons), the unknown values, and the fill rate of each field.

#### Scenario: Report totals
- **WHEN** a snapshot is loaded
- **THEN** created, updated, unchanged and skipped add up to the rows read

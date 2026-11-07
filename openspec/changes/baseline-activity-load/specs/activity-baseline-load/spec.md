## ADDED Requirements

### Requirement: Local-only guarded load

The loader SHALL read an exported snapshot of the sheet's `atividades` tab (CSV or XLSX) from a path given on the command line and write activities through the existing write path (`parseActivityWrite` / `createActivity`). It SHALL refuse to run when `DATABASE_URL` does not point at `localhost`/`127.0.0.1` unless an explicit override flag is passed, and SHALL never read `.env.local` values into its output. Without `--replace` it SHALL only add activities; with `--replace` it SHALL first remove the existing activities.

#### Scenario: Remote database refused

- **WHEN** the loader runs with a `DATABASE_URL` host that is not local and no override flag
- **THEN** it exits non-zero before touching the database and says so

#### Scenario: Replace blocked by references

- **GIVEN** an existing activity is referenced by a program entry
- **WHEN** the loader runs with `--replace` and without `--force`
- **THEN** it exits non-zero, lists the referenced activities, and changes nothing

### Requirement: Deterministic selection

The loader SHALL select up to a requested number of activities (default 200) using a deterministic rule: only rows that pass validation, ordered and balanced across `Fonte` and first age group using a fixed seed, so repeated runs on the same snapshot select the same activities.

#### Scenario: Repeatable selection

- **WHEN** the loader runs twice on the same snapshot with the same limit
- **THEN** the same set of activities is selected both times

### Requirement: Normalisation of sheet values

The loader SHALL map sheet cells to catalogue fields as follows, and SHALL record each lossy step in the report:

- `Mins`: a single number, a range (`15-30`), or text with a unit (`20min`, `20/30 min`, `1h`) SHALL become integer minutes (range → upper bound, hours → ×60); an empty or unparseable value SHALL invalidate the row.
- `Grupo`, `Local`, `Tipo`, `Divisão`: cells holding several comma-separated values SHALL become the list of values (the catalogue stores several per activity, see `multi-value-activity-categories`). Each value SHALL be matched to the accepted set; a value outside it SHALL be dropped and reported, and a row left with no valid value in any of these four categories SHALL be invalid. An empty `Esforço` SHALL invalidate the row.
- `ODS`: numbers or names SHALL be matched to existing SDGs by number or normalised name; an unknown value SHALL be reported and left out, not fail the row.
- `Intruções?` SHALL become `instructions`; `-` or blank SHALL become no instructions.
- `Materiais`: `-` or blank SHALL be replaced by a Portuguese "none needed" text so the required `materials` column is satisfied.
- `Publicada` SHALL NOT decide approval; loaded activities are approved unless the row is invalid.

#### Scenario: Duration range

- **WHEN** a row has `Mins` equal to `15-30`
- **THEN** the activity duration is 30 minutes and the report notes the range was collapsed

#### Scenario: Multi-valued age group

- **WHEN** a row lists several divisions
- **THEN** every recognised division is stored as an age group of the activity and any unrecognised one appears in the report

#### Scenario: Missing mandatory metadata

- **WHEN** a row has no `Esforço`, or no recognised `Grupo`, `Local`, `Tipo` or `Divisão`
- **THEN** the row is skipped and listed with the reason

### Requirement: Duplicate protection

The loader SHALL skip a row whose normalised name (trimmed, lower-cased, accents and extra whitespace removed) matches an already selected or existing activity that shares at least one age group, and SHALL list it in the report.

#### Scenario: Repeat name

- **WHEN** two rows share the same normalised name and age group
- **THEN** only the first is loaded and the second is reported as a duplicate

### Requirement: Load report

Every run SHALL print a summary and write a machine-readable report containing: rows read, selected, loaded, skipped (with reasons), per-column fill rate, values collapsed or dropped, and taxonomy values that could not be mapped (types, SDGs, goal codes). The report SHALL be produced in dry-run mode (`--dry-run`) without writing to the database.

#### Scenario: Dry run

- **WHEN** the loader runs with `--dry-run`
- **THEN** the report is produced and the database is unchanged

### Requirement: Test baseline

The cleaned selection SHALL be exportable as a fixture that can be loaded into `scout_toolkit_test` by a documented command. A source whose licence does not allow redistribution SHALL NOT be committed to the repository; only rows from sources marked as open or public-domain in the `fontes` tab MAY be committed.

#### Scenario: Restricted source excluded from committed fixture

- **GIVEN** a selected activity whose source licence is restricted
- **WHEN** the committed fixture is generated
- **THEN** that activity is excluded from the committed file and is only loadable from a local, untracked snapshot

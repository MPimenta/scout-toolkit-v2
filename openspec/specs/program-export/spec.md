# program-export Specification

## Purpose
TBD - created by archiving change add-activity-instructions. Update Purpose after archive.

## Requirements

### Requirement: Exports include activity instructions

Program exports (Excel and PDF) SHALL include each activity's `instructions` when present, exactly as stored (line breaks preserved) and unaffected by the active locale. Activities without instructions SHALL export with an empty value (Excel) or no instructions block (PDF), and the export SHALL NOT fail. The PDF SHALL keep its existing print-neutral styling.

#### Scenario: Excel activity details include instructions

- **GIVEN** a program containing an activity with instructions
- **WHEN** the program is exported to Excel
- **THEN** the activity details sheet has an "Instruções" column with that text after "Materiais"

#### Scenario: PDF shows instructions

- **GIVEN** a program containing an activity with instructions
- **WHEN** the program PDF is generated
- **THEN** the instructions text appears for that activity, HTML-escaped

#### Scenario: Activity without instructions

- **GIVEN** a program whose activity has no instructions
- **WHEN** it is exported to Excel or PDF
- **THEN** the export succeeds with an empty instructions cell and no instructions block

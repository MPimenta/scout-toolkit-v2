# program-export Specification

## Purpose
What a program export (Excel and PDF) contains for each activity, so a leader can run the session from the file alone: the instructions, the risk analysis and the objectives per division.

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

### Requirement: Exports include risk and objectives per division

The Excel activity details sheet SHALL include, for each activity, the physical and the psychological risk (level, risk and how to reduce it, with the five risk levels shown by their Portuguese labels) and the objectives grouped by division with the observable behaviour for each. An activity without them SHALL export with empty cells and the export SHALL NOT fail.

#### Scenario: Risk and objectives columns

- **GIVEN** a program containing an activity with a medium-to-high physical risk and objectives for two divisions
- **WHEN** the program is exported to Excel
- **THEN** the activity details sheet shows "Médio a alto" with its risk and mitigation, and the objectives listed under each division

#### Scenario: Sparse activity

- **GIVEN** an activity with no risk analysis and no objectives
- **WHEN** the program is exported to Excel
- **THEN** the export succeeds with empty risk and objectives cells

### Requirement: Exports show format and focus

The Excel program sheet and activity details sheet SHALL show, for each activity, its format, main focus and secondary focus in the columns "Formato", "Foco" and "Foco secundário", in place of the former "Tipo de Atividade" column. The PDF SHALL show one line `Formato · Foco · Foco secundário` under the activity name when the activity has a format or a focus. Missing values SHALL leave empty cells and SHALL NOT fail the export.

#### Scenario: Excel columns

- **GIVEN** a program containing an activity with the format Jogo, the focus Cooperação and no secondary focus
- **WHEN** the program is exported to Excel
- **THEN** the activity row has "Jogo" in Formato, "Cooperação" in Foco and an empty Foco secundário

#### Scenario: Activity with no format

- **GIVEN** an activity with no format and no focus
- **WHEN** the program is exported to Excel
- **THEN** its Formato, Foco and Foco secundário cells are empty and the export succeeds

#### Scenario: PDF line

- **GIVEN** an activity with the format Jogo and the focus Cooperação
- **WHEN** the program PDF is generated
- **THEN** the line "Jogo · Cooperação" appears under the activity name, HTML-escaped

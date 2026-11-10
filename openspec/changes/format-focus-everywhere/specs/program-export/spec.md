## ADDED Requirements

### Requirement: Exports show format and focus

The Excel program sheet and activity details sheet SHALL show, for each activity, its format, main focus and secondary focus in the columns "Formato", "Foco" and "Foco secundário", in place of the former "Tipo de Atividade" column. For an activity with no format the "Formato" cell SHALL list its former activity types. The PDF SHALL show one line `Formato · Foco · Foco secundário` under the activity name when the activity has a format or a focus. Missing values SHALL leave empty cells and SHALL NOT fail the export.

#### Scenario: Excel columns

- **GIVEN** a program containing an activity with the format Jogo, the focus Cooperação and no secondary focus
- **WHEN** the program is exported to Excel
- **THEN** the activity row has "Jogo" in Formato, "Cooperação" in Foco and an empty Foco secundário

#### Scenario: Older activity with a type

- **GIVEN** an activity with no format and the former type "Jogos"
- **WHEN** the program is exported to Excel
- **THEN** its Formato cell shows "Jogos"

#### Scenario: PDF line

- **GIVEN** an activity with the format Jogo and the focus Cooperação
- **WHEN** the program PDF is generated
- **THEN** the line "Jogo · Cooperação" appears under the activity name, HTML-escaped

# activity-format-focus Specification

## Purpose
Describes an activity by its format (what kind of activity it is) and its focus (what it develops), replacing the single flat list of activity types.

## Requirements

### Requirement: Official formats and focuses
The system SHALL provide eight formats (Jogo, Quebra-gelo, Reflexão/Debriefing, Técnica/Oficina, Desafio/Iniciativa, Expressão criativa, Energizante, Aventura/Percurso) and ten focuses (Cooperação, Bem-estar físico, Competências técnicas, Valores/Reflexão, Criatividade, Competição amigável, Liderança, Resolução de problemas, Comunicação, Confiança). Each SHALL have a stable code, a Portuguese name, a one-line description and a position, and SHALL be loaded on every environment without running a demo seed. The former type *Serviço* SHALL no longer exist.

#### Scenario: Lists on a new environment
- **WHEN** the reference data is loaded into an empty database
- **THEN** there are 8 formats and 10 focuses with descriptions and positions

#### Scenario: Reload changes nothing
- **WHEN** the reference data is loaded a second time
- **THEN** no format or focus row changes

### Requirement: One format, a main focus and an optional secondary focus
An activity SHALL have exactly one format, one main focus and at most one secondary focus, and the secondary focus SHALL differ from the main one. An activity saved without a format or a main focus SHALL be rejected with a Portuguese validation message.

#### Scenario: Secondary equals main
- **WHEN** an activity is saved with the same focus as main and secondary
- **THEN** the save is rejected and nothing is stored

#### Scenario: Missing format
- **WHEN** an activity is saved without a format
- **THEN** the save is rejected with a Portuguese message naming the field

### Requirement: Managed values
Formats and focuses loaded from the sheet SHALL be managed: they cannot be renamed or deleted from the admin area (conflict response), while an admin may add values of their own.

#### Scenario: Delete a managed format
- **WHEN** an admin tries to delete the format *Jogo*
- **THEN** the system answers with a conflict and the format remains

### Requirement: Filtering and counts
The catalogue SHALL filter by format and by focus (an activity matches a focus filter when the focus is its main or secondary one), and the read API SHALL return each value with its description, position and the number of approved activities that use it.

#### Scenario: Focus filter includes secondary
- **WHEN** a visitor filters by *Liderança*
- **THEN** activities whose main or secondary focus is *Liderança* are listed

### Requirement: Existing activities migrate
Activities that carry the former types SHALL keep working: each former type that has a direct format or focus equivalent SHALL be mapped to it, and the rest SHALL be reported for an admin to complete.

#### Scenario: Former type mapped
- **WHEN** the migration runs on an activity of type *Quebra-Gelo*
- **THEN** its format is *Quebra-gelo*

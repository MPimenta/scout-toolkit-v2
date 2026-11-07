## Purpose

The official list of activity types as small, managed reference data, with the metadata the editor and the catalogue filter need.

## ADDED Requirements

### Requirement: Official type list

Every environment SHALL contain exactly these ten official types: Jogo, Quebra-Gelo, Desafio, Reflexão, Criatividade, Cooperação, Liderança, Aventura, Serviço and Técnica. Each SHALL have a unique code, a one-line Portuguese description, a group (`format` or `focus`) and a position, and SHALL be marked as managed.

#### Scenario: Fresh environment

- **GIVEN** an empty database with the schema applied
- **WHEN** the reference data is loaded
- **THEN** the ten types exist once each, with code, description, group and position, and loading again changes nothing

#### Scenario: Existing environment

- **GIVEN** a database whose types are the ten official names (any case or accent) and whose activities are linked to them
- **WHEN** the migration and the loader run
- **THEN** the same rows gain their code and metadata, keep their ids, and no activity link changes

### Requirement: Managed types are read-only

The admin API SHALL answer 409 with a Portuguese message when a managed type is updated or deleted. Admins SHALL still be able to create their own types; those SHALL be unmanaged, SHALL NOT need a code, SHALL appear after the official ones and SHALL be editable and deletable while no activity uses them.

#### Scenario: Renaming an official type

- **WHEN** an admin tries to rename "Técnica"
- **THEN** the API returns 409 and the name is unchanged

#### Scenario: Admin-created type

- **WHEN** an admin creates the type "Música"
- **THEN** it is stored as unmanaged, listed after the official types, and can be deleted while no activity uses it

### Requirement: Read API fields

`GET /api/taxonomies/activity-types` SHALL return, for each type, its id, code, name, description, group, position, whether it is managed, and `activity_count` (the number of **approved** activities linked to it), ordered by group, then position, then name. Types created by admins SHALL be returned with the group `other`.

#### Scenario: Counts

- **GIVEN** 70 approved activities and 1 unapproved activity linked to "Jogo"
- **WHEN** the endpoint is read
- **THEN** "Jogo" shows `activity_count` 70

#### Scenario: Unused type

- **GIVEN** no activity uses "Serviço"
- **WHEN** the endpoint is read
- **THEN** "Serviço" is returned with `activity_count` 0

### Requirement: Type metadata in the editor

The activity editor SHALL show the types grouped (Formato, Foco, Outros) with each type's description as help text, and SHALL keep requiring at least one type. Types with no activity SHALL still be selectable in the editor.

#### Scenario: Choosing a type

- **WHEN** a leader opens the type picker
- **THEN** the ten types appear under their groups and each shows its description on focus or hover

### Requirement: Test types never persist

The loader SHALL NOT delete unmanaged types. The e2e and integration tests SHALL NOT leave created types behind. Any type that is unmanaged, has no code and has no activity MAY be removed by an admin; a one-off cleanup of known test types SHALL be run only after confirmation.

#### Scenario: E2E run

- **WHEN** the e2e suite finishes
- **THEN** no type created by it remains in the database

### Requirement: Import matches by name or code

The activities import SHALL match each `Tipo` value to a type by normalised name or code and SHALL report values with no match without creating a type.

#### Scenario: Unknown type in the sheet

- **GIVEN** a row whose `Tipo` is "Jogo, Música"
- **WHEN** it is loaded
- **THEN** the activity is linked to Jogo and the report lists "Música" as unmatched

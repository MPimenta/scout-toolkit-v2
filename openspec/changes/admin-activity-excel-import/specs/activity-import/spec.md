## Purpose

Lets admins import catalogue activities from a fixed Excel template, validating constrained fields and skipping rows that already exist.

## ADDED Requirements

### Requirement: Admin can import the published workbook

An admin SHALL upload an `.xlsx` whose first sheet is **Atividades** with these header columns, in any order: `nome`, `descricao`, `materiais`, `duracao_minutos`, `tamanho_grupo`, `esforco`, `local`, `faixa_etaria`, `tipo`, `objetivos`, `ods`, `imagem_url`, `publicada`. Guests SHALL receive 401. Non-admins SHALL receive 403. The import SHALL create one activity per valid new row. Empty rows SHALL be ignored.

#### Scenario: Admin imports a valid new row

- **WHEN** an admin uploads a workbook with one complete new activity
- **THEN** that activity is stored
- **AND** the response counts it as created

#### Scenario: Member cannot import

- **WHEN** a signed-in user with role `user` posts an import
- **THEN** the API returns 403 and stores nothing

### Requirement: Constrained fields must match the catalogue

`tamanho_grupo`, `esforco`, `local`, and `faixa_etaria` SHALL accept the stored enum key or the current Portuguese label. `tipo` SHALL match an existing activity-type name (case-insensitive). `objetivos` SHALL be zero or more existing goal **codes** separated by `;`. `ods` SHALL be zero or more SDG **numbers** 1–17 separated by `;`. `duracao_minutos` SHALL be an integer ≥ 1. `imagem_url` MAY be empty or an https URL. `publicada` SHALL be `sim` (default when empty) or `nao`. A row that fails any of these SHALL not be stored and SHALL be listed as invalid with the row number and reason.

#### Scenario: Unknown type is invalid

- **WHEN** a row has `tipo` = `Desconhecido`
- **THEN** that row is not stored
- **AND** the report marks it invalid

#### Scenario: Portuguese enum labels are accepted

- **WHEN** a row uses `faixa_etaria` = `Escoteiros (10-14)` and `local` = `Exterior`
- **THEN** the activity is stored with `age_group` `scouts` and `location` `outside`

### Requirement: Repeats are skipped

A row is a repeat when its normalised `nome` (trim, collapse spaces, case-insensitive) and `faixa_etaria` already exist on an activity in the database or on an earlier row in the same file. Repeats SHALL not be stored and SHALL be counted as skipped. Different age groups with the same name SHALL both import.

#### Scenario: Same name and section already exists

- **GIVEN** an activity named `Jogo da bandeira` for `scouts`
- **WHEN** the file has the same name and `Escoteiros (10-14)`
- **THEN** that row is skipped
- **AND** no second activity is created

#### Scenario: Same name for another section is not a repeat

- **GIVEN** `Jogo da bandeira` for `scouts`
- **WHEN** the file has `Jogo da bandeira` for `Lobitos (6-10)`
- **THEN** that row is created

### Requirement: Import reports results

After processing, the admin SHALL see counts of created, skipped (repeats), and invalid rows, plus a line per skipped or invalid row. Created activities SHALL be approved unless `publicada` is `nao`. `created_by` SHALL be the importing admin.

#### Scenario: Mixed file

- **GIVEN** a file with one new row, one repeat, and one invalid type
- **WHEN** an admin imports it
- **THEN** created is 1, skipped is 1, invalid is 1

### Requirement: Template is available

Admins SHALL be able to download the published template workbook (Atividades + Valores + Instruções) from the admin activities screen. The template SHALL include one example row and the allowed values for every constrained field.

#### Scenario: Admin downloads the template

- **WHEN** an admin opens the admin activities page
- **THEN** they can download the Excel template

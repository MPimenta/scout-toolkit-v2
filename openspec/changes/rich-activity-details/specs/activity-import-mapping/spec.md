## Purpose

How the curated activities sheet (`atividades_v2`) maps to the activity record, so a load fills every new field and reports what it could not map.

## ADDED Requirements

### Requirement: Column mapping

The sheet loader SHALL map: `Fonte` and `link_fonte` to the source and its link; `Instruções` to instructions unchanged; `Risco físico` and `Risco psicológico` by splitting at the first colon into level (Baixo, Médio, Alto) and text; `Mitigação físico/psicológica` to the mitigations; `Objetivos educativos (por divisão)` and `Comportamentos a observar (objetivos)` into per-division objective rows with behaviours; `ODS` and `Justificação dos ODS` into SDG links with justifications; `Desafios` into *desafio* links by code; `Divisão`, `Grupo`, `Local`, `Tipo` as before. The editorial workflow columns SHALL be ignored.

#### Scenario: Risk cell

- **GIVEN** the cell "Médio: corridas e apanhadas com risco de colisões."
- **WHEN** it is loaded
- **THEN** the physical risk level is `medium` and the text is "corridas e apanhadas com risco de colisões."

#### Scenario: Range level

- **GIVEN** the cell "Baixo a médio: vergonha de falhar o ritmo."
- **WHEN** it is loaded
- **THEN** the level is `medium` (the higher) and the text keeps the original wording "Baixo a médio: vergonha de falhar o ritmo."

### Requirement: Objectives and behaviours blocks

An objectives cell SHALL be parsed as blocks starting with a division label (`Lobitos:`, `Escoteiros:`, `Exploradores:`, `Caminheiros:`, `Dirigentes (referência: …):`) followed by bullet lines `• código texto`. A behaviours cell SHALL be parsed the same way with lines `• código: comportamento`, matched to objective rows by division and code. The `Dirigentes` block SHALL create `leaders` rows that reference rovers objectives.

#### Scenario: Two divisions

- **GIVEN** objectives blocks for Lobitos and Escoteiros and matching behaviours
- **WHEN** the row is loaded
- **THEN** each objective is stored for its division with its behaviour

#### Scenario: Shared code in two blocks

- **GIVEN** `5I.3-4` listed under Exploradores and Caminheiros with different behaviours
- **WHEN** the row is loaded
- **THEN** two rows exist with their own behaviour

### Requirement: Nothing is dropped silently

The loader SHALL report, per row, every value it could not map: unknown objective codes, behaviour lines without a matching objective, SDG justifications for SDGs not listed, *desafio* codes not in the Matriz, unknown sources, and risk cells without a recognisable level. A row SHALL still load without the unmappable values. The report SHALL NOT contain copyrighted text from the sheet in committed files.

#### Scenario: Unknown desafio

- **GIVEN** a row listing `XX-Z - texto`
- **WHEN** it is loaded
- **THEN** the activity loads without that *desafio* and the report names `XX-Z` and the row

### Requirement: Safe by default

The loader SHALL keep refusing a non-local database unless explicitly overridden, and SHALL NOT commit any sheet content.

#### Scenario: Remote database

- **WHEN** `DATABASE_URL` points at a non-local host
- **THEN** the loader exits with an error before reading the sheet

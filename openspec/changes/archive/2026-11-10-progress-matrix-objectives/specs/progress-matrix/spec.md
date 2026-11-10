## Purpose

Holds the Escoteiros de Portugal *Matriz de Progresso Pessoal* as reference data: development areas, general objectives, age-specific objectives, and the *desafios* that develop them. Every environment gets the same data without anyone seeding it by hand.

## ADDED Requirements

### Requirement: Development areas and general objectives

The catalogue SHALL contain the six development areas of the Matriz, identified by the letters used in objective codes: `A` Afetivo, `C` Carácter, `E` Espiritual, `F` Físico, `I` Intelectual, `S` Social. It SHALL contain the 40 general objectives (`1A`…`5A`, `1C`…`9C`, `1E`…`7E`, `1F`…`5F`, `1I`…`6I`, `1S`…`8S`), each belonging to exactly one educational path (and so to one area) and carrying the official text unchanged.

#### Scenario: Areas after loading

- **WHEN** the reference data has been loaded
- **THEN** the public educational-areas list has exactly the six areas above and no placeholder area

#### Scenario: General objective belongs to its area

- **WHEN** a client reads general objective `4E`
- **THEN** it belongs to the Espiritual area and shows the Matriz text

### Requirement: Educational paths

The catalogue SHALL contain the 20 educational paths (*Caminhos Educativos*) of the Regulamento do Programa para Jovens (Anexo 1), each belonging to one area and grouping the general objectives below. Física: Conhecimento do corpo (`1F`, `2F`), Estilo de vida ativo e saudável (`3F`, `4F`), Eficiência (`5F`). Afetiva: Consciência emocional (`1A`), Expressão criativa (`2A`), Regulação emocional (`3A`, `4A`, `5A`). Carácter: Identidade (`1C`, `2C`), Autonomia (`3C`, `4C`), Compromisso (`5C`, `6C`, `7C`), Valores (`8C`, `9C`). Espiritual: Deslumbramento (`1E`), Sabedoria (`2E`, `3E`), Pertença (`4E`), Descoberta e reflexão (`5E`, `6E`, `7E`). Intelectual: Recolha de informação (`1I`), Análise crítica (`2I`, `3I`), Resolução de problemas (`4I`, `5I`, `6I`). Social: Relacionamento e comunicação (`1S`, `2S`, `3S`), Cooperação e liderança (`4S`, `5S`), Solidariedade e envolvimento (`6S`, `7S`, `8S`).

#### Scenario: Path of a general objective

- **WHEN** a client reads general objective `6C`
- **THEN** it belongs to the path Compromisso in the Carácter area

#### Scenario: Every general objective has a path

- **WHEN** the reference data is loaded
- **THEN** each of the 40 general objectives belongs to exactly one of the 20 paths

### Requirement: Objectives specific to each age group

The catalogue SHALL contain the 174 specific objectives of the Matriz. Each SHALL have a unique code (for example `1A.1`, `4E.1.3-4`), the official text, one general objective, and one or more age groups. Matriz stage columns map to the divisions of the Regulamento and to age groups as Alcateia → `cub_scouts` (Lobitos, 7–10½), Tribo de Escoteiros → `scouts` (10½–14), Tribo de Exploradores → `adventurers` (14–17), Clã → `rovers` (17–21). Chefia (`leaders`) has no specific objectives. A code ending in a stage range (`3-4`) is one objective that belongs to every age group in the range. The single cell marked "[sem objetivo específico]" SHALL produce no objective.

#### Scenario: One objective per stage

- **WHEN** a client reads the objectives of general objective `1A`
- **THEN** it gets `1A.1` for `cub_scouts`, `1A.2` for `scouts`, `1A.3` for `adventurers` and `1A.4` for `rovers`

#### Scenario: Shared objective

- **WHEN** a client reads objective `3A.3-4`
- **THEN** it is stored once and belongs to both `adventurers` and `rovers`

#### Scenario: Stage without an objective

- **WHEN** the reference data is loaded
- **THEN** no objective exists for general objective `7E` at stage 1

### Requirement: Challenge types and challenges

The catalogue SHALL contain the 7 challenge types of the Matriz (Estilo de Vida Ativo e Saudável, Vida ao Ar Livre, Comunidade e Cidadania, Valores e Atitudes, Vivência Escotista, Técnicas Úteis, Criatividade) and its 112 *desafios*. Each *desafio* SHALL have a type, an age group (derived from the position of its column in the Matriz: A–D `cub_scouts`, E–H `scouts`, I–L `adventurers`, M–P `rovers`), its Matriz text unchanged, and links to the specific objectives the Matriz lists for it. All 286 links SHALL be stored exactly as listed, even when a linked objective belongs to a different age group than the *desafio*.

#### Scenario: Challenge with its objectives

- **WHEN** a client reads the first *desafio* of Estilo de Vida Ativo e Saudável
- **THEN** it belongs to `cub_scouts`, carries the Matriz text, and is linked to objective `4F.3.1`

#### Scenario: Every link resolves

- **WHEN** the reference data is generated or loaded
- **THEN** every objective code listed for a *desafio* matches a stored objective, otherwise generation fails and names the code

### Requirement: Reference data loads on every environment

A loader SHALL apply the Matriz on local, test, e2e, Preview and Production environments, whether or not the catalogue already has activities. It SHALL upsert by code, so running it twice leaves the data unchanged, and it SHALL NOT touch activities, programs or users. It SHALL update the text of rows it owns when the dataset changes.

#### Scenario: Fresh environment

- **GIVEN** an empty database with the schema applied
- **WHEN** the environment is created
- **THEN** the six areas, 40 general objectives, 174 objectives, 7 types, 112 *desafios* and 286 distinct links exist without running the demo-activity seed

#### Scenario: Non-empty catalogue

- **GIVEN** an environment that already has activities
- **WHEN** a deploy runs the loader
- **THEN** the reference data is present and the activities are unchanged

#### Scenario: Idempotent

- **WHEN** the loader runs twice in a row
- **THEN** the second run inserts and updates nothing

### Requirement: Placeholder goals are retired

The loader SHALL remove the placeholder areas and goals that earlier seeds created (identified by their known codes, such as `SOCIAL` and `SOCIAL_COMM`) together with their links to activities. It SHALL NOT remove areas or goals created by an admin.

#### Scenario: Old seed data

- **GIVEN** an activity linked to the placeholder goal `SOCIAL_COMM`
- **WHEN** the loader runs
- **THEN** the goal is gone and the activity keeps all its other data and relations

#### Scenario: Admin-created goal survives

- **GIVEN** an admin-created goal with a code that is neither a placeholder nor a Matriz code
- **WHEN** the loader runs
- **THEN** that goal and its activity links remain

### Requirement: Dataset provenance

The dataset SHALL be committed as a versioned file generated from the exported Matriz workbook by a script in the repository. The script SHALL be deterministic and SHALL fail with the offending cell when it cannot parse a code or resolve a link. The workbook itself SHALL NOT be committed.

#### Scenario: Regeneration

- **WHEN** the script runs twice on the same workbook
- **THEN** the dataset files are byte-identical

#### Scenario: Unresolvable code

- **WHEN** a *desafio* lists a code that is not in the objectives sheet
- **THEN** the script exits with an error naming the type, column and code, and writes nothing

### Requirement: Source precedence and reconciliation

Objective codes and text come from the Regulamento do Programa para Jovens v1.2 (Dec 2024, Anexo 1), the regulation in force; *desafios* and their objective links come only from the workbook, since the Regulamento does not list them. Codes SHALL be normalised to the dotted form (`4F1.1` becomes `4F.1.1`). The generator SHALL write a reconciliation report listing every objective whose text or code differs between the two sources, every code that appears in only one, and every *desafio* link to a code the Regulamento does not have. Where the Regulamento repeats another objective's text word for word (a likely copy slip), the generator SHALL keep the workbook text and flag it. No difference SHALL be resolved silently, and the report SHALL be committed beside the dataset.

#### Scenario: Differing text

- **GIVEN** objective `4A.2` is "Gerir as suas emoções." in the workbook and repeats the text of `3A.2` in the Regulamento
- **WHEN** the generator runs
- **THEN** the dataset keeps the workbook text and the report lists `4A.2` as flagged

#### Scenario: Merged stage range

- **GIVEN** the Regulamento lists `6C.2-3` once for two stages where the workbook has `6C.2` and `6C.3`
- **WHEN** the generator runs
- **THEN** the report lists the merged range and the dataset keeps the workbook's separate codes, because the *desafios* link them separately

#### Scenario: Code format

- **WHEN** the Regulamento writes `4F1.1` and the workbook writes `4F.1.1`
- **THEN** both are treated as the same objective

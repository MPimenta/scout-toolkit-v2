## Purpose

Lets leaders classify, browse, and filter activities by progression challenges, each belonging to a named type, independently of educational objectives.

## ADDED Requirements

### Requirement: Challenge belongs to a type

A challenge SHALL have an id, a non-empty name, a non-empty description, and a `type_id` that references an existing challenge type. A challenge type SHALL have an id and a non-empty unique name. Challenge types SHALL be a separate catalogue from educational areas and from activity types. Guests SHALL read challenge types and challenges via public GET taxonomies.

#### Scenario: Guest lists challenges

- **WHEN** a guest requests the public challenges list
- **THEN** each item includes id, name, description, and its type id and name

#### Scenario: Challenge without a type is rejected

- **WHEN** an admin creates a challenge with a missing or unknown `type_id`
- **THEN** the API returns 400 or 404 and stores nothing

### Requirement: Seed the seven challenge types and ten challenges

The database seed SHALL upsert these challenge types by unique name, with this exact Portuguese spelling:

- Estilo de Vida Ativo e Saudável
- Vida ao Ar Livre
- Comunidade e Cidadania
- Valores e Atitudes
- Vivência Escotista
- Técnicas Úteis
- Criatividade

The seed SHALL also upsert these ten challenges by unique name. Each challenge SHALL belong to exactly one type. A type MAY have more than one challenge. Re-running the seed SHALL NOT duplicate a type or a challenge. The seed SHALL NOT replace educational areas or activity types.

| Challenge name | Type | Description (seed) |
| --- | --- | --- |
| Completar 5 nós | Técnicas Úteis | Lista de 10 nós; basta completar 5 |
| Montar um abrigo simples | Vida ao Ar Livre | Abrigo com materiais naturais; proteção ao vento e chuva leve chega |
| Seguir um percurso com pistas | Vida ao Ar Livre | Percurso com pelo menos 5 pistas (charadas, códigos ou rumos) |
| Resolver um código ou charada em equipa | Criatividade | Decifrar pelo menos 3 pistas em colaboração |
| Partilhar uma reflexão do dia | Valores e Atitudes | Partilhar um momento, uma aprendizagem e um sentimento |
| Escutar o outro sem interromper | Vivência Escotista | Escutar cada partilha no círculo até ao fim |
| Recolher lixo numa ação de serviço | Comunidade e Cidadania | Participar numa limpeza e encher pelo menos um saco |
| Cuidar do espaço comum | Comunidade e Cidadania | Deixar o local melhor do que foi encontrado |
| Apresentar-se com um gesto original | Criatividade | Dizer o nome com um gesto que o grupo consiga repetir |
| Jogar pelo menos 15 minutos em movimento | Estilo de Vida Ativo e Saudável | Jogo ativo durante pelo menos 15 minutos |

The seed SHALL link those challenges to the existing demo activities as follows (an activity MAY have more than one challenge):

- Jogo do Nome e Gesto → Apresentar-se com um gesto original; Jogar pelo menos 15 minutos em movimento
- Caça ao Tesouro → Seguir um percurso com pistas; Resolver um código ou charada em equipa
- Reflexão do Dia → Partilhar uma reflexão do dia; Escutar o outro sem interromper
- Construção de Abrigo → Completar 5 nós; Montar um abrigo simples
- Limpeza da Comunidade → Recolher lixo numa ação de serviço; Cuidar do espaço comum

Admins MAY still create, update, and delete types and challenges after seed.

#### Scenario: Guest sees seeded types

- **WHEN** a guest requests the public challenge-types list after seed
- **THEN** the list includes all seven names above

#### Scenario: Guest sees ten seeded challenges

- **WHEN** a guest requests the public challenges list after seed
- **THEN** the list includes all ten challenge names
- **AND** each challenge has exactly one type from the seven

#### Scenario: Demo activity has its seeded challenges

- **WHEN** a guest opens the detail of "Construção de Abrigo" after seed
- **THEN** the activity includes "Completar 5 nós" (Técnicas Úteis) and "Montar um abrigo simples" (Vida ao Ar Livre)

#### Scenario: Re-seed does not duplicate

- **WHEN** the challenge seed runs a second time
- **THEN** each of the seven type names and ten challenge names appears once
- **AND** each demo activity still has the same challenge links without duplicates

### Requirement: Activity has zero or more challenges

An activity SHALL store an ordered-independent set of challenge ids. Creating or updating an activity SHALL replace the set. Unknown challenge ids SHALL return 400 and store no new relations. An activity with no challenges SHALL be valid.

#### Scenario: Activity with two challenges

- **WHEN** an admin saves an activity with two valid challenge ids
- **THEN** the activity detail includes both challenges with name, description, and type name

#### Scenario: Unknown challenge id

- **WHEN** an activity write includes a challenge id that does not exist
- **THEN** the API returns 400 and does not create that relation

#### Scenario: Empty challenges

- **WHEN** an activity is saved with no challenge ids
- **THEN** the activity is stored with an empty challenges list

### Requirement: Catalogue shows challenges next to objectives

The activity tile view, table view, and detail page SHALL show the activity's challenges immediately adjacent to educational objectives. Tile and table SHALL show challenge names as badges, truncated with a remainder count using the same limits as objectives (three on the tile, two on the table). Detail SHALL show each challenge name, description, and type name. When the activity has no challenges, those challenge blocks SHALL be omitted.

#### Scenario: Tile shows challenge badges

- **GIVEN** an approved activity with challenges "Completar 5 nós" and "Caminhada de 5 km"
- **WHEN** a user opens the activities tile view
- **THEN** the card shows those challenge names next to the objectives badges

#### Scenario: Detail shows description

- **GIVEN** a challenge named "Completar 5 nós" whose description explains a set of 10 nós of which 5 suffice
- **WHEN** a user opens that activity's detail page
- **THEN** the challenges section sits next to the objectives section and shows the name, description, and type name

#### Scenario: No challenges hides the block

- **GIVEN** an approved activity with objectives but no challenges
- **WHEN** a user opens tile, table, or detail
- **THEN** objectives still appear and the challenges block is absent

### Requirement: Filter activities by challenges

The activities list SHALL accept a multi-select challenges filter using the same control pattern as educational objectives (checkbox list in the advanced filters section, including the mobile sheet). Selecting one or more challenges SHALL return activities that have at least one of those challenges. Clearing the filter SHALL remove the constraint. Guests SHALL be able to filter.

#### Scenario: Multi-select match

- **GIVEN** activity A linked to challenge X and activity B linked only to challenge Y
- **WHEN** a user selects challenge X in the challenges filter
- **THEN** the list includes A and excludes B

#### Scenario: Any-of semantics

- **GIVEN** activity A linked to X and activity B linked to Y
- **WHEN** a user selects both X and Y
- **THEN** the list includes A and B

#### Scenario: Clear challenges filter

- **GIVEN** a challenges filter is active
- **WHEN** the user clears filters
- **THEN** activities are no longer constrained by challenge

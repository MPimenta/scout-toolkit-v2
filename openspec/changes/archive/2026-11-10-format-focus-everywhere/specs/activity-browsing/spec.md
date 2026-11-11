## MODIFIED Requirements

### Requirement: Cards open the activity

Each activity card in the catalogue SHALL open the activity page when any part of the card is activated, by pointer or keyboard. Cards SHALL show the activity's format and main focus as their label, each only when the activity has it, and no label slot at all when it has neither. The catalogue SHALL NOT show internal development notes.

#### Scenario: Click the card body

- **WHEN** a user clicks the description area of a card
- **THEN** the activity page opens

#### Scenario: Keyboard

- **WHEN** a keyboard user focuses a card and presses Enter
- **THEN** the activity page opens

#### Scenario: Format and focus as the label

- **GIVEN** an activity with the format Jogo and the focus Cooperação
- **WHEN** the catalogue lists it
- **THEN** its card shows "Jogo" and "Cooperação" as the label

#### Scenario: Format only

- **GIVEN** an activity with the format Jogo and no focus
- **WHEN** the catalogue lists it
- **THEN** its card shows "Jogo" as the label

#### Scenario: No label

- **GIVEN** an activity with no format and no focus
- **WHEN** the catalogue lists it
- **THEN** its card has no label slot

### Requirement: Search matches anywhere in the text

A search term SHALL match approved activities whose name, description, materials, or instructions contain the term anywhere, ignoring letter case. A single word SHALL match inside longer text, not only at its start.

#### Scenario: Word in the middle of a name

- **GIVEN** an approved activity named "Jogo do Fogo"
- **WHEN** a user searches for "fogo"
- **THEN** "Jogo do Fogo" is in the results

#### Scenario: Word in the materials

- **GIVEN** an approved activity whose materials include "cordas"
- **WHEN** a user searches for "CORDAS"
- **THEN** that activity is in the results

#### Scenario: Word in the instructions

- **GIVEN** an approved activity whose instructions mention "lenço" and whose name, description and materials do not
- **WHEN** a user searches for "LENÇO"
- **THEN** that activity is in the results

## ADDED Requirements

### Requirement: Activities can be requested by id

The catalogue API SHALL accept an `ids` parameter (a comma-separated list of up to 100 activity ids) and, when it is present, SHALL return exactly those approved activities with the same fields as a catalogue page, ignoring `page` and `limit`. Ids beyond the first 100 SHALL be ignored. Unknown ids SHALL simply be absent from the result.

#### Scenario: More ids than one page

- **GIVEN** 25 approved activities
- **WHEN** a client asks for all 25 by id, with the default page size of 20
- **THEN** all 25 are returned

#### Scenario: Unknown id

- **WHEN** a client asks for one existing id and one that does not exist
- **THEN** only the existing activity is returned

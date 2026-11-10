## MODIFIED Requirements

### Requirement: Cards open the activity

Each activity card in the catalogue SHALL open the activity page when any part of the card is activated, by pointer or keyboard. Cards SHALL show the activity's format as their label, or the former activity type when the activity has no format yet, or no label slot at all when it has neither. The catalogue SHALL NOT show internal development notes.

#### Scenario: Click the card body

- **WHEN** a user clicks the description area of a card
- **THEN** the activity page opens

#### Scenario: Keyboard

- **WHEN** a keyboard user focuses a card and presses Enter
- **THEN** the activity page opens

#### Scenario: Format as the label

- **GIVEN** an activity with the format Jogo and no activity type
- **WHEN** the catalogue lists it
- **THEN** its card shows "Jogo" as the label

#### Scenario: Former type as fallback

- **GIVEN** an older activity with no format and the type "Jogos"
- **WHEN** the catalogue lists it
- **THEN** its card shows "Jogos" as the label

#### Scenario: No label

- **GIVEN** an activity with no format and no type
- **WHEN** the catalogue lists it
- **THEN** its card has no label slot

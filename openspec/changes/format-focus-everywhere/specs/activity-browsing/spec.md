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

## Purpose

Each SDG linked to an activity carries a short justification explaining why it was chosen.

## ADDED Requirements

### Requirement: Justification per SDG

Each activity-SDG link SHALL be able to store a justification text (optional, at most 1000 characters). A justification SHALL NOT exist without its SDG link.

#### Scenario: Justified SDG

- **WHEN** an activity is saved with SDG 3 and the justification "o jogo obriga a correr, esquivar e planear…"
- **THEN** the justification is stored on that link and returned with the SDG

#### Scenario: Removing the SDG

- **WHEN** SDG 3 is removed from the activity
- **THEN** its justification disappears with it

### Requirement: SDG section on the detail page

The detail page SHALL show each SDG with its official image (the SDG's `icon_url`, never a plain number tile) and its name followed by its justification. The image SHALL have alternative text with the SDG number and name. An SDG without a justification SHALL show only the image and name. Justifications SHALL appear in two columns on desktop and one on phones.

#### Scenario: Two SDGs

- **GIVEN** SDG 3 and SDG 17, both justified
- **WHEN** the section renders
- **THEN** two blocks are shown, each with the SDG image, name and its own justification

### Requirement: Editor

For each selected SDG the editor SHALL show a justification textarea. The activity payload SHALL carry `sdgs: [{ sdg_id, justification? }]`; the existing `sdg_ids` SHALL keep working without justifications.

#### Scenario: Old payload

- **WHEN** a client sends `sdg_ids` only
- **THEN** the SDGs are linked with no justification

## ADDED Requirements

### Requirement: Phone controls meet touch size and a missing image does not take a screen

On a phone, primary controls and standalone links SHALL have a hit area of at least 44 px high. When an activity has no image, its placeholder SHALL occupy no more than 96 px of height on the activity detail page and cards SHALL not reserve an empty image band, so the title and primary actions are visible without scrolling.

#### Scenario: Detail without image on a phone

- **WHEN** an activity without an image is shown at 390×844
- **THEN** the title and the "Adicionar ao programa" button are visible without scrolling

#### Scenario: Catalogue card without image

- **WHEN** an activity without an image is shown as a card
- **THEN** the card has no empty image band above the title

#### Scenario: Header controls

- **WHEN** the header is shown on a phone
- **THEN** "Entrar" and the account button each have a hit area of at least 44 px high

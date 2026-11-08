## Purpose

Defines how leaders search and filter the public activity catalogue so the results, counts, and pages they see are complete and consistent.

## ADDED Requirements

### Requirement: Search matches anywhere in the text

A search term SHALL match approved activities whose name, description, or materials contain the term anywhere, ignoring letter case. A single word SHALL match inside longer text, not only at its start.

#### Scenario: Word in the middle of a name

- **GIVEN** an approved activity named "Jogo do Fogo"
- **WHEN** a user searches for "fogo"
- **THEN** "Jogo do Fogo" is in the results

#### Scenario: Word in the materials

- **GIVEN** an approved activity whose materials include "cordas"
- **WHEN** a user searches for "CORDAS"
- **THEN** that activity is in the results

### Requirement: Filters apply before pagination

Every filter, including SDGs and educational goals, SHALL be applied before results are counted and split into pages. The total count SHALL equal the number of activities matching all active filters. Every page except the last SHALL be full.

#### Scenario: SDG filter with many activities

- **GIVEN** 30 approved activities, 5 of them linked to SDG 13
- **WHEN** a user filters by SDG 13 with 20 results per page
- **THEN** the total is 5
- **AND** page 1 lists all 5

### Requirement: Invalid query parameters are rejected

The catalogue API SHALL reject unknown enum values, non-numeric durations, unsupported comparison operators, and page or limit values below 1 with a 400 response. It SHALL NOT respond with a server error for bad input.

#### Scenario: Unsupported duration operator

- **WHEN** a client requests activities with `duration_min=30&duration_operator=!=`
- **THEN** the response is 400 with a Portuguese validation message

#### Scenario: Valid operator

- **WHEN** a client requests activities with `duration_min=30&duration_operator=>=`
- **THEN** only activities of 30 minutes or more are returned

### Requirement: Cards open the activity

Each activity card in the catalogue SHALL open the activity page when any part of the card is activated, by pointer or keyboard. Cards SHALL show the activity type label, or no label slot at all when the type is missing. The catalogue SHALL NOT show internal development notes.

#### Scenario: Click the card body

- **WHEN** a user clicks the description area of a card
- **THEN** the activity page opens

#### Scenario: Keyboard

- **WHEN** a keyboard user focuses a card and presses Enter
- **THEN** the activity page opens

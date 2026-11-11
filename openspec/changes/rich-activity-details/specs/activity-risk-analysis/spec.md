## Purpose

Physical and psychological risk analysis with a mitigation each, stored on the activity and always visible on the detail page.

## ADDED Requirements

### Requirement: Risk analysis fields

An activity SHALL be able to store, for physical and for psychological risk separately: a level (`low`, `medium`, `high`), a description of what can go wrong, and a mitigation. All six fields SHALL be optional. A level without text, or text without a level, SHALL be accepted.

#### Scenario: Complete analysis

- **WHEN** an activity is saved with level `medium`, a physical risk text and a physical mitigation
- **THEN** all three are stored and returned in the activity payload

#### Scenario: Legacy activity

- **GIVEN** an activity created before this change
- **WHEN** it is read
- **THEN** the six fields are null and nothing fails

### Requirement: Level validation

The API SHALL reject a risk level that is not `low`, `medium` or `high` with a Portuguese validation error, and SHALL limit each risk and mitigation text to 2000 characters.

#### Scenario: Invalid level

- **WHEN** a write carries physical risk level `extreme`
- **THEN** the API returns 400 and stores nothing

### Requirement: Safety is always visible

The detail page SHALL show a safety section that is never collapsed. It SHALL contain two cards (physical, psychological), side by side on desktop and stacked on phones. Each card SHALL show a level badge (text label and a one-to-three bar icon; Baixo outlined, Médio in the blue tint, Alto in the destructive colour), then "O que pode correr mal", then "Como reduzir". Colour SHALL NOT be the only indicator of the level.

#### Scenario: Both risks present

- **GIVEN** physical risk `medium` and psychological risk `low`, each with mitigation
- **WHEN** the section renders
- **THEN** two cards show "Médio" and "Baixo", each with its description followed by its mitigation

#### Scenario: Only one dimension

- **GIVEN** only the physical analysis is filled
- **WHEN** the section renders
- **THEN** the psychological card says the analysis is not available

### Requirement: Missing analysis is explicit

When an activity has no risk analysis at all, the safety section SHALL say "Análise de risco ainda não disponível" and remind the leader to assess the risks themselves. The page SHALL NOT infer or generate risk content.

#### Scenario: No analysis

- **GIVEN** an activity with all six fields empty
- **WHEN** the page renders
- **THEN** the safety section shows the notice instead of cards

### Requirement: Editing and completeness

The admin editor and the proposal form SHALL offer the six fields in a safety step. The admin activity list SHALL mark activities with no analysis as incomplete. Approval SHALL NOT require an analysis unless the product owner decides otherwise (open question in the proposal).

#### Scenario: Admin list

- **GIVEN** an approved activity without a risk analysis
- **WHEN** an admin opens the activity list
- **THEN** it is marked "análise de risco em falta"

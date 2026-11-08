## MODIFIED Requirements

### Requirement: Suggest one field at a time

A signed-in user SHALL submit a suggestion against one allowed field (`name`, `description`, `materials`, `instructions`, `approximate_duration_minutes`, `group_size`, `effort_level`, `location`, `age_group`) with a non-empty `suggested_value`. Guests SHALL receive 401. Unknown fields SHALL return 400. More than one pending suggestion per user per activity per field SHALL be rejected (409).

#### Scenario: Suggest a materials fix

- **WHEN** a signed-in user suggests a new materials text on an approved activity
- **THEN** a pending suggestion is stored for that field

#### Scenario: Suggest instructions

- **WHEN** a signed-in user suggests instructions text on an approved activity
- **THEN** a pending suggestion is stored for the `instructions` field, and accepting it updates the activity's instructions

#### Scenario: Guest cannot suggest

- **WHEN** a guest posts a suggestion
- **THEN** the API returns 401

#### Scenario: Duplicate pending

- **GIVEN** Ana already has a pending suggestion on description
- **WHEN** she submits another description suggestion for the same activity
- **THEN** the API returns 409

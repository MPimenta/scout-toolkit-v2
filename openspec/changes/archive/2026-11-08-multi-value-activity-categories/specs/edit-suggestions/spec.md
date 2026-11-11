## MODIFIED Requirements

### Requirement: Suggest one field at a time

A signed-in user SHALL submit a suggestion against one allowed field (`name`, `description`, `materials`, `instructions`, `approximate_duration_minutes`, `group_sizes`, `effort_level`, `locations`, `age_groups`, `activity_types`) with a non-empty `suggested_value`. For the four category fields the value SHALL be a non-empty list of valid values and, when accepted, SHALL replace the activity's whole set for that category. Guests SHALL receive 401. Unknown fields SHALL return 400. More than one pending suggestion per user per activity per field SHALL be rejected (409).

#### Scenario: Suggest a materials fix

- **WHEN** a signed-in user suggests a new materials text on an approved activity
- **THEN** a pending suggestion is stored for that field

#### Scenario: Suggest instructions

- **WHEN** a signed-in user suggests instructions text on an approved activity
- **THEN** a pending suggestion is stored for the `instructions` field, and accepting it updates the activity's instructions

#### Scenario: Suggest an extra age group

- **WHEN** a user suggests `age_groups = [scouts, rovers]` for an activity currently `[scouts]`
- **THEN** a pending suggestion is stored; on acceptance the activity has both

#### Scenario: Invalid category list

- **WHEN** a suggestion for `locations` has an empty list or an unknown value
- **THEN** the API returns 400

#### Scenario: Guest cannot suggest

- **WHEN** a guest posts a suggestion
- **THEN** the API returns 401

#### Scenario: Duplicate pending

- **GIVEN** Ana already has a pending suggestion on description
- **WHEN** she submits another description suggestion for the same activity
- **THEN** the API returns 409

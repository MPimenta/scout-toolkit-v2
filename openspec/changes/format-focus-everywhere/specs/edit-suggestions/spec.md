## MODIFIED Requirements

### Requirement: Suggest one field at a time

A signed-in user SHALL submit a suggestion against one allowed field (`name`, `description`, `materials`, `instructions`, `approximate_duration_minutes`, `group_sizes`, `effort_level`, `locations`, `age_groups`, `format_id`, `focus_id`, `secondary_focus_id`) with a non-empty `suggested_value`. For the category fields (`group_sizes`, `locations`, `age_groups`) the value SHALL be a non-empty list of valid values and, when accepted, SHALL replace the activity's whole set for that category. For `format_id`, `focus_id` and `secondary_focus_id` the value SHALL be the id of an existing format or focus; the resulting main focus SHALL differ from the resulting secondary focus; accepting the suggestion SHALL set that field. A suggestion for the former `activity_types` SHALL be rejected with 400, but one already pending SHALL stay resolvable. Guests SHALL receive 401. Unknown fields SHALL return 400. More than one pending suggestion per user per activity per field SHALL be rejected (409).

#### Scenario: Suggest a materials fix

- **WHEN** a signed-in user suggests a new materials text on an approved activity
- **THEN** a pending suggestion is stored for that field

#### Scenario: Suggest instructions

- **WHEN** a signed-in user suggests instructions text on an approved activity
- **THEN** a pending suggestion is stored for the `instructions` field, and accepting it updates the activity's instructions

#### Scenario: Suggest an extra age group

- **WHEN** a user suggests `age_groups = [scouts, rovers]` for an activity currently `[scouts]`
- **THEN** a pending suggestion is stored; on acceptance the activity has both

#### Scenario: Suggest a format

- **WHEN** a user suggests the id of the format Quebra-gelo for an activity whose format is Jogo
- **THEN** a pending suggestion is stored; on acceptance the activity's format is Quebra-gelo

#### Scenario: Suggest a secondary focus equal to the main focus

- **GIVEN** an activity whose main focus is Confiança
- **WHEN** a user suggests Confiança as its secondary focus
- **THEN** the API returns 400 with a Portuguese message

#### Scenario: Unknown format

- **WHEN** a suggestion for `format_id` carries an id that does not exist
- **THEN** the API returns 400

#### Scenario: Former type no longer suggestable

- **WHEN** a user posts a new suggestion for `activity_types`
- **THEN** the API returns 400

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

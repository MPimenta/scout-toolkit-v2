## Purpose

Lets signed-in leaders propose a single-field correction on an activity, and lets admins accept or reject it with a visible history and in-app notice.

## ADDED Requirements

### Requirement: Suggest one field at a time

A signed-in user SHALL submit a suggestion against one allowed field (`name`, `description`, `materials`, `approximate_duration_minutes`, `group_size`, `effort_level`, `location`, `age_group`) with a non-empty `suggested_value`. Guests SHALL receive 401. Unknown fields SHALL return 400. More than one pending suggestion per user per activity per field SHALL be rejected (409).

#### Scenario: Suggest a materials fix

- **WHEN** a signed-in user suggests a new materials text on an approved activity
- **THEN** a pending suggestion is stored for that field

#### Scenario: Guest cannot suggest

- **WHEN** a guest posts a suggestion
- **THEN** the API returns 401

#### Scenario: Duplicate pending

- **GIVEN** Ana already has a pending suggestion on description
- **WHEN** she submits another description suggestion for the same activity
- **THEN** the API returns 409

### Requirement: Admin accept or reject

An admin SHALL list pending suggestions and accept or reject each one. Accept SHALL write `suggested_value` onto the activity field, set status `approved`, and set `reviewed_by` / `reviewed_at`. Reject SHALL leave the activity unchanged and set status `rejected`. Non-admins SHALL receive 403 on review.

#### Scenario: Accept updates the activity

- **GIVEN** a pending suggestion that changes the activity name to "Jogo da bússola"
- **WHEN** an admin accepts it
- **THEN** the activity name is "Jogo da bússola"
- **AND** the suggestion status is `approved`

#### Scenario: Reject leaves the activity

- **GIVEN** a pending suggestion on description
- **WHEN** an admin rejects it
- **THEN** the activity description is unchanged
- **AND** the suggestion status is `rejected`

### Requirement: Suggestor history

The author of a suggestion SHALL list their own suggestions with status and timestamps. They SHALL NOT see other people's suggestions. Admins SHALL see the full queue.

#### Scenario: Author sees own history

- **WHEN** Ana opens her suggestion history
- **THEN** she sees her pending, approved, and rejected items
- **AND** she does not see Bruno's items

### Requirement: In-app notifications

The system SHALL create an in-app notification when a suggestion is submitted (to admins) and when it is decided (to the suggestor). Email and websockets SHALL NOT be required. The recipient SHALL mark a notification read. Notifications SHALL be Portuguese.

#### Scenario: Suggestor is notified of accept

- **WHEN** an admin accepts Ana's suggestion
- **THEN** Ana has an unread notification that it was accepted

#### Scenario: Admins are notified of a new suggestion

- **WHEN** Bruno submits a suggestion
- **THEN** each admin has an unread notification pointing at the review queue

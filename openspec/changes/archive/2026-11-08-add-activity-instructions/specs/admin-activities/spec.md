## MODIFIED Requirements

### Requirement: Admin CRUD for activities

An admin SHALL create, update, and delete activities with name, description, materials, optional instructions, duration, group size, effort, location, age group, activity type, educational goals, and SDGs. A non-admin SHALL receive 403. Deletes SHALL fail with 409 when the activity is still referenced by a program entry, unless the admin confirms a force that nulls those references (the default is 409).

#### Scenario: Admin creates an activity

- **WHEN** an admin submits a valid activity with one goal and one SDG
- **THEN** the activity is stored and those relations exist

#### Scenario: Non-admin cannot create

- **WHEN** a non-admin submits a new activity
- **THEN** the API returns 403

#### Scenario: Admin saves instructions

- **WHEN** an admin creates or edits an activity with multi-line instructions text
- **THEN** the instructions are stored as written, line breaks included, and returned by the activity API

#### Scenario: Instructions are optional

- **WHEN** an admin submits an activity without instructions
- **THEN** the activity is stored with no instructions and no validation error occurs

#### Scenario: Delete blocked while referenced

- **GIVEN** an activity used in a program entry
- **WHEN** an admin deletes it without force
- **THEN** the API returns 409 and the activity remains

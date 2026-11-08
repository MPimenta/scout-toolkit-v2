## MODIFIED Requirements

### Requirement: Admin CRUD for activities

An admin SHALL create, update, and delete activities with name, description, materials, optional instructions, duration, one or more group sizes, effort, one or more locations, one or more age groups, one or more activity types, educational goals, and SDGs. Each of group sizes, locations, age groups and activity types SHALL contain at least one value, otherwise the request SHALL fail with 400. A non-admin SHALL receive 403. Deletes SHALL fail with 409 when the activity is still referenced by a program entry, unless the admin confirms a force that nulls those references (the default is 409).

#### Scenario: Admin creates an activity

- **WHEN** an admin submits a valid activity with one goal and one SDG
- **THEN** the activity is stored and those relations exist

#### Scenario: Create with several values

- **WHEN** an admin creates an activity with two age groups and two activity types
- **THEN** the activity is stored with both of each

#### Scenario: Update replaces the set

- **WHEN** an admin changes an activity's locations from `inside, outside` to `outside`
- **THEN** only `outside` remains linked

#### Scenario: Non-admin cannot create

- **WHEN** a signed-in user with role `user` posts an admin create
- **THEN** the API returns 403 and stores nothing

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

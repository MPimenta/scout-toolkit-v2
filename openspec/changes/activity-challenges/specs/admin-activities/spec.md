## MODIFIED Requirements

### Requirement: Admin CRUD for activities

An admin SHALL create, update, and delete activities with name, description, materials, duration, group size, effort, location, age group, activity type, educational goals, challenges, and SDGs. A non-admin SHALL receive 403. Deletes SHALL fail with 409 when the activity is still referenced by a program entry, unless the admin confirms a force that nulls those references (the default is 409). The activity editor SHALL include a challenges multi-select immediately after the educational objectives control.

#### Scenario: Admin creates an activity

- **WHEN** an admin submits a valid activity with one goal, one challenge, and one SDG
- **THEN** the activity is stored and those relations exist

#### Scenario: Non-admin cannot create

- **WHEN** a signed-in user with role `user` posts an admin create
- **THEN** the API returns 403 and stores nothing

#### Scenario: Delete blocked while referenced

- **GIVEN** an activity used in a program entry
- **WHEN** an admin deletes it without force
- **THEN** the API returns 409 and the activity remains

#### Scenario: Editor places challenges next to objectives

- **WHEN** an admin opens create or edit activity
- **THEN** the form shows a challenges multi-select immediately after the educational objectives control

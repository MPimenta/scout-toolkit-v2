# admin-activities Specification

## Purpose

Lets admins create, update, delete, illustrate, classify, and approve catalogue activities so the public list stays current.

## Requirements

### Requirement: Admin CRUD for activities

An admin SHALL create, update, and delete activities with name, description, materials, duration, group size, effort, location, age group, activity type, educational goals, and SDGs. A non-admin SHALL receive 403. Deletes SHALL fail with 409 when the activity is still referenced by a program entry, unless the admin confirms a force that nulls those references (the default is 409).

#### Scenario: Admin creates an activity

- **WHEN** an admin submits a valid activity with one goal and one SDG
- **THEN** the activity is stored and those relations exist

#### Scenario: Non-admin cannot create

- **WHEN** a signed-in user with role `user` posts an admin create
- **THEN** the API returns 403 and stores nothing

#### Scenario: Delete blocked while referenced

- **GIVEN** an activity used in a program entry
- **WHEN** an admin deletes it without force
- **THEN** the API returns 409 and the activity remains

### Requirement: Image URL or upload

An admin SHALL set `image_url` to an HTTPS URL or upload a JPEG, PNG, or WebP file of at most 5MB. Invalid type or size SHALL return 400. Clearing the image SHALL set `image_url` to null.

#### Scenario: Upload too large

- **WHEN** an admin uploads a 6MB PNG
- **THEN** the API returns 400 and `image_url` is unchanged

#### Scenario: HTTPS URL accepted

- **WHEN** an admin sets `image_url` to an https URL
- **THEN** the activity detail shows that image

### Requirement: Public catalogue is browse-only

The public activities list SHALL NOT show Edit or Delete. Those actions SHALL live on the admin activity screens. Guests and signed-in non-admins SHALL only browse and open details.

#### Scenario: Table view has no edit

- **WHEN** any user opens the public activities table
- **THEN** there is no Edit or Delete control that targets `/admin/activities/...`

### Requirement: Approval controls public visibility

An admin SHALL set `is_approved` true or false. Public list and guest detail SHALL include only approved activities. An unapproved id SHALL return 404 to guests and to non-admin users who are not the author.

#### Scenario: Unpublish hides from the catalogue

- **GIVEN** an approved activity visible on `/atividades`
- **WHEN** an admin sets `is_approved` false
- **THEN** the public list no longer includes it
- **AND** a guest detail request returns 404

#### Scenario: Admin still sees unapproved

- **WHEN** an admin opens the admin activity list filtered to pending
- **THEN** unapproved activities appear

### Requirement: created_by uses Auth.js user

`created_by` SHALL reference the Auth.js `"user"` id. When an admin creates a catalogue activity, `created_by` MAY be null or the admin's id. The unused `users` table SHALL NOT be the FK target.

#### Scenario: Admin-created row does not require the unused users table

- **WHEN** an admin creates an activity
- **THEN** the row is stored without inserting into `users`

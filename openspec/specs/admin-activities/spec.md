# admin-activities Specification

## Purpose

Lets admins create, update, delete, illustrate, classify, and approve catalogue activities so the public list stays current.

## Requirements

### Requirement: Admin CRUD for activities

An admin SHALL create, update, and delete activities with name, description, materials, optional instructions, duration, one or more group sizes, effort, one or more locations, one or more age groups, one format, one main focus and optionally a secondary focus, educational goals, and SDGs. Each of group sizes, locations and age groups SHALL contain at least one value, and the format and the main focus SHALL be present, otherwise the request SHALL fail with 400. A non-admin SHALL receive 403. Deletes SHALL fail with 409 when the activity is still referenced by a program entry, unless the admin confirms a force that nulls those references (the default is 409).

#### Scenario: Admin creates an activity

- **WHEN** an admin submits a valid activity with one goal and one SDG
- **THEN** the activity is stored and those relations exist

#### Scenario: Create with several values

- **WHEN** an admin creates an activity with two age groups and two locations
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

#### Scenario: Format and focus required

- **WHEN** an admin submits an activity without a format or without a main focus
- **THEN** the API returns 400 and stores nothing

#### Scenario: External id is not editable

- **WHEN** an admin edits an activity that came from the reference sheet
- **THEN** its external id is shown read-only and cannot be changed

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

### Requirement: Activity objectives must match its age groups

When an admin creates or updates an activity, every `educational_goal_ids` entry SHALL belong to at least one of the activity's age groups, as defined by the `activity-objectives` capability. Otherwise the API SHALL return 400 with a Portuguese message that names the offending objectives and SHALL change nothing. The same rule SHALL apply to user-submitted activities.

#### Scenario: Admin links a mismatched objective

- **GIVEN** an admin creating an activity for `cub_scouts`
- **WHEN** the payload includes objective `1A.2` (an Escoteiros objective)
- **THEN** the API returns 400 naming `1A.2` and stores nothing

#### Scenario: Admin updates age groups and objectives together

- **GIVEN** an activity for `scouts` linked to `1A.2`
- **WHEN** an admin changes it to `scouts` and `rovers`, adding `1A.4`
- **THEN** both objectives are linked

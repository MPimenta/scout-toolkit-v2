## MODIFIED Requirements

### Requirement: Admin CRUD for the four catalogue taxonomies

An admin SHALL create, update, and delete activity types, educational areas, educational goals, and SDGs. Public GET taxonomy endpoints SHALL stay readable by guests. Non-admins SHALL receive 403 on writes. An educational goal SHALL reference an existing general objective, SHALL belong to one or more age groups, and its `area_id` SHALL reference the area of that general objective. SDG `number` SHALL be unique in 1–17. Area and goal `code` SHALL stay unique. Areas, general objectives, goals and challenges that come from the Matriz are managed by the reference-data loader: an update or delete of such a row SHALL return 409 and change nothing. Admins SHALL still be able to add goals of their own.

#### Scenario: Admin adds a goal to an area

- **WHEN** an admin creates a goal with a valid general objective, at least one age group and a unique code
- **THEN** the public educational-goals list includes it with its general objective, area and age groups

#### Scenario: Goal in the wrong area

- **WHEN** an admin creates a goal whose `area_id` is not the area of its general objective
- **THEN** the API returns 400 and stores nothing

#### Scenario: Matriz row is read-only

- **WHEN** an admin updates or deletes the objective `1A.1` that came from the Matriz
- **THEN** the API returns 409 and the objective is unchanged

#### Scenario: Duplicate SDG number

- **WHEN** an admin creates an SDG whose number already exists
- **THEN** the API returns 409 or 400 and stores nothing

#### Scenario: Non-admin write

- **WHEN** a regular user posts a new activity type
- **THEN** the API returns 403

### Requirement: Referential delete rules

Deleting an activity type that is still referenced by an activity SHALL return 409. Deleting an SDG or goal that is still linked to an activity SHALL return 409. Deleting a general objective that still has goals SHALL return 409. Deleting an educational area SHALL cascade to its goals only when those goals are unreferenced and the area has no general objectives; otherwise the delete SHALL return 409.

#### Scenario: Cannot delete a type in use

- **GIVEN** an activity whose type is "Jogos"
- **WHEN** an admin deletes that type
- **THEN** the API returns 409 and the type remains

#### Scenario: Cannot delete a general objective with goals

- **GIVEN** an admin-created general objective that has one goal
- **WHEN** an admin deletes the general objective
- **THEN** the API returns 409 and both remain

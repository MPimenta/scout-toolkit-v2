## ADDED Requirements

### Requirement: Admin CRUD for challenge types and challenges

An admin SHALL create, update, and delete challenge types and challenges. Public GET endpoints for challenge types and challenges SHALL stay readable by guests. Non-admins SHALL receive 403 on writes. Challenge `type_id` SHALL reference an existing challenge type. Challenge-type names SHALL stay unique. Educational areas, educational goals, and activity types SHALL remain separate catalogues.

#### Scenario: Admin adds a challenge to a type

- **WHEN** an admin creates a challenge with a valid challenge-type id, name, and description
- **THEN** the public challenges list includes it with that type

#### Scenario: Duplicate challenge-type name

- **WHEN** an admin creates a challenge type whose name already exists
- **THEN** the API returns 409 or 400 and stores nothing

#### Scenario: Non-admin cannot write challenges

- **WHEN** a regular user posts a new challenge
- **THEN** the API returns 403

### Requirement: Referential delete rules for challenges

Deleting a challenge that is still linked to an activity SHALL return 409. Deleting a challenge type SHALL cascade to its challenges only when those challenges are unreferenced; otherwise the delete SHALL return 409.

#### Scenario: Cannot delete a challenge in use

- **GIVEN** an activity linked to challenge "Completar 5 nós"
- **WHEN** an admin deletes that challenge
- **THEN** the API returns 409 and the challenge remains

#### Scenario: Cannot delete a challenge type whose challenges are in use

- **GIVEN** an activity linked to a challenge of type "Técnicas Úteis"
- **WHEN** an admin deletes that type
- **THEN** the API returns 409 and the type remains

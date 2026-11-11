## ADDED Requirements

### Requirement: Activity list at scale
The admin activity list SHALL page on the server (default 25 per page), search by name, and filter by approval state, format, focus, division, source and completeness, keeping the filters in the address so a view can be shared. The list SHALL show for each activity its name, approval state, format, main focus, divisions, source and completeness.

#### Scenario: Filter by format and approval
- **WHEN** an admin filters by format *Jogo* and state *por aprovar*
- **THEN** only unapproved activities with that format are listed

#### Scenario: Shareable view
- **WHEN** an admin copies the address of a filtered list and opens it
- **THEN** the same filters and page are applied

### Requirement: Completeness indicator
Each activity SHALL show which of these it lacks: format, main focus, educational objectives, *desafios*, risk analysis, ODS and image. The list SHALL filter by a missing item.

#### Scenario: Missing objectives
- **WHEN** an activity has no educational objectives
- **THEN** its row shows "sem objetivos" and the filter *sem objetivos* includes it

### Requirement: Bulk actions
An admin SHALL select several activities and approve, unapprove or delete them in one action. The system SHALL ask for confirmation stating the number of activities, SHALL apply the action in a single transaction and SHALL report how many were changed. Deleting activities used in programs SHALL follow the single-delete rule (409 unless forced). A non-admin SHALL receive 403.

#### Scenario: Bulk approve
- **WHEN** an admin selects 12 unapproved activities and confirms *aprovar*
- **THEN** all 12 become approved and the page says 12 were changed

#### Scenario: Bulk delete with a used activity
- **WHEN** one of the selected activities is in a program and the admin does not force
- **THEN** the request returns 409 naming that activity
- **AND** none of the selected activities is deleted

### Requirement: Duplicate an activity
An admin SHALL duplicate an activity into a new unapproved activity with the same content, relations and a name ending in " (cópia)". The copy SHALL have no external id and no program references.

#### Scenario: Duplicate
- **WHEN** an admin duplicates an approved activity
- **THEN** a new unapproved activity exists with the same relations and no external id

### Requirement: Delete shows what depends on the activity
Before a delete the admin SHALL see how many programs use the activity and how many reviews and suggestions it has.

#### Scenario: Used in programs
- **WHEN** an admin starts deleting an activity that is in 3 programs
- **THEN** the confirmation says it is used in 3 programs

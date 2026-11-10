## ADDED Requirements

### Requirement: Formats and focuses management
The taxonomies page SHALL list the formats and the focuses with their description, position, whether they come from the reference sheet, and how many activities use each. Values from the reference sheet SHALL be read-only (rename and delete return 409). An admin SHALL add values of their own with a name and a description, and SHALL rename, reorder and delete those. Non-admins SHALL receive 403 on writes.

#### Scenario: Add a focus
- **WHEN** an admin adds the focus "Sustentabilidade" with a description
- **THEN** it appears in the focus list, the editor and the filter

#### Scenario: Sheet value is read-only
- **WHEN** an admin tries to rename the format *Jogo*
- **THEN** the API returns 409 and the name is unchanged

### Requirement: Move activities before deleting a value
An admin SHALL delete an own format or focus only when no activity uses it, or after choosing another value to move all its activities to. The move and the delete SHALL happen in one transaction, and the confirmation SHALL state how many activities move.

#### Scenario: Value in use
- **WHEN** an admin deletes an own focus used by 14 activities without choosing a target
- **THEN** the API returns 409 and nothing changes

#### Scenario: Move then delete
- **WHEN** an admin deletes an own focus and picks *Cooperação* as target
- **THEN** its 14 activities now have *Cooperação* as main or secondary focus as before
- **AND** the focus is deleted

#### Scenario: Move would duplicate
- **WHEN** an activity has the deleted focus as secondary and the target as main
- **THEN** its secondary focus becomes empty

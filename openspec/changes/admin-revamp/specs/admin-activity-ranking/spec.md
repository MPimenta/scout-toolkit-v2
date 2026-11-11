## Purpose

Shows administrators which activities leaders add to programs most and least, so the catalogue can be improved where it is used.

## ADDED Requirements

### Requirement: Admin-only ranking
The ranking page and its API SHALL be available to admins only.

#### Scenario: Non-admin
- **WHEN** a signed-in user without the admin role requests the ranking API
- **THEN** the API returns 403

### Requirement: Most added activities
The page SHALL rank approved activities by the number of distinct programs that contain them, and show for each its name, format, focus, divisions, the number of distinct programs and the number of distinct leaders who added it. Repeated entries of the same activity in one program SHALL count once. The names SHALL link to the activity. The default list SHALL show the top 20.

#### Scenario: Counted once per program
- **WHEN** an activity appears three times in one program and once in another
- **THEN** it counts 2 programs

#### Scenario: Distinct leaders
- **WHEN** an activity is in four programs owned by two users
- **THEN** it shows 4 programs and 2 leaders

### Requirement: Period and filters
The ranking SHALL filter by period (program creation date), division, format and focus, and SHALL show how many programs fall in the selected period.

#### Scenario: Division filter
- **WHEN** an admin selects Caminheiros
- **THEN** only activities suitable for Caminheiros are ranked

### Requirement: Least used
The page SHALL show the approved activities with the fewest additions, including those with none, ordered by creation date so recent additions are not mistaken for unpopular ones.

#### Scenario: Never added
- **WHEN** an approved activity has never been added to a program
- **THEN** it appears in the least-used list with 0 programs

### Requirement: No personal data
The ranking SHALL show counts only. It SHALL NOT show program names, user names or emails, and private programs SHALL count in totals without being identifiable.

#### Scenario: Private programs
- **WHEN** an activity is in a private program
- **THEN** the program counts toward the activity's total
- **AND** nothing identifies the program or its owner

## ADDED Requirements

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

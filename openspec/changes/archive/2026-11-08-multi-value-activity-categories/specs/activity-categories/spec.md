## ADDED Requirements

### Requirement: Multiple values per category

An activity SHALL be linkable to one or more group sizes, one or more locations, one or more activity types and one or more age groups. Every activity SHALL have at least one value in each category. The same value SHALL NOT be linked twice to one activity. Activity read endpoints SHALL return each category as an array (`group_sizes`, `locations`, `activity_types`, `age_groups`) in a stable order.

#### Scenario: Several age groups and types

- **WHEN** an activity is saved with age groups `cub_scouts` and `scouts` and two activity types
- **THEN** reading it returns both age groups and both activity types

#### Scenario: Empty category rejected

- **WHEN** an activity is saved with no age group
- **THEN** the request fails with 400 and a Portuguese message

#### Scenario: Duplicate values collapsed

- **WHEN** a payload lists the same location twice
- **THEN** the activity is stored with that location once

### Requirement: Category filters match any value

The catalogue filters for group size, location, activity type and age group SHALL accept several selected values. An activity SHALL match a category filter when at least one of its values in that category is selected. Different categories SHALL combine with AND. An activity SHALL appear once in the results however many of its values match.

#### Scenario: Match through one of several values

- **GIVEN** an activity for `cub_scouts` and `scouts`
- **WHEN** the catalogue is filtered by age group `scouts`
- **THEN** the activity is listed once

#### Scenario: Categories combine

- **WHEN** filtering by age group `scouts` and location `inside`
- **THEN** only activities having both a `scouts` age group and an `inside` location are listed

### Requirement: Existing activities migrate without loss

The migration SHALL convert each existing single value into one link in the matching category, so every existing activity ends with exactly one value per category and its filter results are unchanged.

#### Scenario: Backfill

- **GIVEN** an activity with age group `rovers`, location `outside`, group size `large` and one type
- **WHEN** the migration runs
- **THEN** it has exactly those values linked and no others

### Requirement: Display of all values

Activity cards, detail, admin table, program views and Excel/PDF exports SHALL show all linked values of each category, joined in a readable list, using the existing Portuguese labels.

#### Scenario: Export lists all values

- **WHEN** a program containing an activity with two locations is exported to Excel
- **THEN** the location cell lists both labels

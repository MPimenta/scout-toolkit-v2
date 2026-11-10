# activity-categories Specification

## Purpose

Describes the multi-valued categories of an activity (group sizes, locations and age groups) and how the catalogue filters match them. What kind of activity it is, and what it works on, are the format and the focus, defined in `activity-format-focus`.

## Requirements

### Requirement: Display of all values

Activity cards, detail, admin table, program views and Excel/PDF exports SHALL show all linked values of each category, joined in a readable list, using the existing Portuguese labels. The kind of activity SHALL be shown as its format and focus.

#### Scenario: Export lists all values

- **WHEN** a program containing an activity with two locations is exported to Excel
- **THEN** the location cell lists both labels

### Requirement: Group size, location and age group values

An activity SHALL be linkable to one or more group sizes, one or more locations and one or more age groups, and every activity SHALL have at least one value in each of those three categories. There SHALL be no activity-type category: what kind of activity it is and what it works on are the format and the focus (`activity-format-focus`). The same value SHALL NOT be linked twice to one activity. Activity read endpoints SHALL return each category as an array (`group_sizes`, `locations`, `age_groups`) in a stable order and SHALL NOT return `activity_types`.

#### Scenario: Several age groups and locations

- **WHEN** an activity is saved with age groups `cub_scouts` and `scouts` and two locations
- **THEN** reading it returns both age groups and both locations

#### Scenario: Empty category rejected

- **WHEN** an activity is saved with no age group
- **THEN** the request fails with 400 and a Portuguese message

#### Scenario: No activity type

- **WHEN** an activity is read
- **THEN** the response has no `activity_types` field

#### Scenario: Old field ignored on write

- **WHEN** a write carries `activity_type_ids`
- **THEN** the field is ignored and the activity is saved from the other fields

#### Scenario: Duplicate values collapsed

- **WHEN** a payload lists the same location twice
- **THEN** the activity is stored with that location once

### Requirement: Size, location and age group filters match any value

The catalogue filters for group size, location and age group SHALL accept several selected values. An activity SHALL match a category filter when at least one of its values in that category is selected. Different categories SHALL combine with AND, and with the format and focus filters defined in `activity-format-focus`. An activity SHALL appear once in the results however many of its values match. The catalogue SHALL NOT filter by activity type, and an `activity_type` query parameter SHALL be ignored.

#### Scenario: Match through one of several values

- **GIVEN** an activity for `cub_scouts` and `scouts`
- **WHEN** the catalogue is filtered by age group `scouts`
- **THEN** the activity is listed once

#### Scenario: Categories combine

- **WHEN** filtering by age group `scouts` and location `inside`
- **THEN** only activities having both a `scouts` age group and an `inside` location are listed

#### Scenario: Type parameter ignored

- **WHEN** a client requests the catalogue with an `activity_type` parameter
- **THEN** the parameter has no effect on the results

# activity-categories Specification

## Purpose

Describes the multi-valued categories of an activity (group sizes, locations, age groups and the former activity types) and how the catalogue filters match them. What kind of activity it is, and what it works on, are the format and the focus, defined in `activity-format-focus`.

## Requirements

### Requirement: Multiple values per category

An activity SHALL be linkable to one or more group sizes, one or more locations and one or more age groups, and every activity SHALL have at least one value in each of those three categories. An activity MAY also be linked to one or more activity types: they are the former classification, kept for older data, and a new activity SHALL NOT need one. The same value SHALL NOT be linked twice to one activity. Activity read endpoints SHALL return each category as an array (`group_sizes`, `locations`, `age_groups`, `activity_types`) in a stable order, with `activity_types` empty when none is linked.

#### Scenario: Several age groups and locations

- **WHEN** an activity is saved with age groups `cub_scouts` and `scouts` and two locations
- **THEN** reading it returns both age groups and both locations

#### Scenario: Empty category rejected

- **WHEN** an activity is saved with no age group
- **THEN** the request fails with 400 and a Portuguese message

#### Scenario: No activity type needed

- **WHEN** an activity is saved with a format and a focus and no activity type
- **THEN** it is saved, and reading it returns an empty `activity_types` list

#### Scenario: Duplicate values collapsed

- **WHEN** a payload lists the same location twice
- **THEN** the activity is stored with that location once

### Requirement: Category filters match any value

The catalogue filters for group size, location and age group SHALL accept several selected values. An activity SHALL match a category filter when at least one of its values in that category is selected. Different categories SHALL combine with AND, and with the format and focus filters defined in `activity-format-focus`. An activity SHALL appear once in the results however many of its values match. The `activity_type` query parameter SHALL keep working for older clients, but the catalogue interface SHALL NOT offer it.

#### Scenario: Match through one of several values

- **GIVEN** an activity for `cub_scouts` and `scouts`
- **WHEN** the catalogue is filtered by age group `scouts`
- **THEN** the activity is listed once

#### Scenario: Categories combine

- **WHEN** filtering by age group `scouts` and location `inside`
- **THEN** only activities having both a `scouts` age group and an `inside` location are listed

#### Scenario: Former type parameter still answers

- **WHEN** a client requests the catalogue with `activity_type` set to a former type
- **THEN** only activities linked to that type are listed

### Requirement: Display of all values

Activity cards, detail, admin table, program views and Excel/PDF exports SHALL show all linked values of each category, joined in a readable list, using the existing Portuguese labels. The activity type SHALL be shown only as a fallback for an activity that has no format yet; where a format or focus exists it takes the place of the type (see `activity-format-focus`).

#### Scenario: Export lists all values

- **WHEN** a program containing an activity with two locations is exported to Excel
- **THEN** the location cell lists both labels

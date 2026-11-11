## Purpose

Lets administrators understand how the catalogue is used (what is searched, viewed and added to programs) so they can improve it.

## ADDED Requirements

### Requirement: Admin-only usage page

The system SHALL provide an administrator page at `/admin/utilizacao`, linked from the admin dashboard. Guests and non-admin users, including an administrator previewing as a member, SHALL NOT see it and SHALL NOT be able to call its API. When the `usage-tracking` flag is off the page and API SHALL answer 404.

#### Scenario: Administrator

- **WHEN** an administrator opens `/admin/utilizacao`
- **THEN** the usage figures are shown

#### Scenario: Member

- **WHEN** a signed-in non-admin calls the usage API
- **THEN** the answer is 403

#### Scenario: Guest

- **WHEN** a guest calls the usage API
- **THEN** the answer is 401

#### Scenario: Flag off

- **WHEN** the flag is off
- **THEN** the page and API answer 404

### Requirement: Period and division filters

The page SHALL let the administrator choose a period of 7 days, 30 days (default), 90 days or 13 months, and optionally one division. All figures SHALL respect both. A division SHALL select search events that filtered by it, and view and addition events of activities that belong to it.

#### Scenario: Changing the period

- **WHEN** the administrator picks 7 days
- **THEN** only events from the last 7 days are counted

#### Scenario: Choosing a division

- **WHEN** the administrator picks Escoteiros
- **THEN** searches filtered by Escoteiros and views and additions of Escoteiros activities are counted

#### Scenario: Invalid period

- **WHEN** the API receives an unknown period
- **THEN** it answers 400 with a Portuguese message

### Requirement: Totals and evolution

The page SHALL show, for the selection, the number of searches, activity views, additions to programs, distinct visitors and distinct signed-in users, and a day-by-day evolution of the three event types using the Lisbon calendar day.

#### Scenario: Totals

- **WHEN** the period holds 10 searches, 20 views and 4 additions
- **THEN** the totals show 10, 20 and 4

#### Scenario: Days without events

- **WHEN** a day in the period has no events
- **THEN** it appears with zero

### Requirement: Viewed versus used in programs

The page SHALL list the top 10 activities by views and the top 10 by additions to programs, each row showing the activity name, its views, its additions and the conversion (additions divided by views, empty when there are no views). The names SHALL link to the activity.

#### Scenario: Conversion

- **WHEN** an activity has 20 views and 5 additions
- **THEN** its conversion shows 25%

#### Scenario: Added without views

- **WHEN** an activity was added to programs but has no views in the period
- **THEN** it appears in the additions list with no conversion

### Requirement: Searches

The page SHALL list the most frequent search texts with their count and average number of results, the number of searches per division (searches without a division counted apart), and the most frequent searches that returned no results. Texts SHALL be compared ignoring case and surrounding spaces. Searches made only with filters and no text SHALL count towards the division figures and not towards the text lists.

#### Scenario: Repeated text

- **WHEN** "Jogo" and "jogo " were searched 3 and 2 times
- **THEN** one row "jogo" shows 5

#### Scenario: No results

- **WHEN** "xyz" was searched 4 times and always returned 0
- **THEN** it appears in the no-results list with 4

#### Scenario: Filter-only search

- **WHEN** a search had a division filter and no text
- **THEN** it counts for that division and is absent from the text lists

### Requirement: Users by name

The page SHALL list the 10 most active signed-in users in the selection with their name and counts of searches, views and additions. Users without a name SHALL appear as "Utilizador sem nome". Anonymous visitors SHALL NOT be listed individually, and e-mail addresses SHALL NOT be shown.

#### Scenario: Named user

- **WHEN** a signed-in leader named Maria made events
- **THEN** the list shows "Maria" with her counts

#### Scenario: Anonymous

- **WHEN** events come from visitors who never signed in
- **THEN** they count in the totals and are not listed

### Requirement: Honest reading of the figures

The page SHALL state that figures are indicative, because bots, privacy signals and opt-outs are not recorded, and SHALL show an empty state when the selection has no events.

#### Scenario: No data

- **WHEN** the selection has no events
- **THEN** the page says there are no events for this selection

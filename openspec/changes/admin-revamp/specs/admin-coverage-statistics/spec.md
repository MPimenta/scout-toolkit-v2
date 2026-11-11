## Purpose

Shows administrators which parts of the educational framework (objectives, areas, divisions and *desafios*) the catalogue and the programs cover, so they can see the gaps and decide what to add.

## ADDED Requirements

### Requirement: Admin-only coverage page
The coverage page and its API SHALL be available to admins only. A non-admin SHALL receive 403 from the API and the forbidden page in the interface.

#### Scenario: Non-admin
- **WHEN** a signed-in user without the admin role requests the coverage API
- **THEN** the API returns 403 and no figures

### Requirement: Coverage of objectives
For each specific objective the page SHALL show the number of approved activities linked to it, per division the objective belongs to, and SHALL roll the figures up to general objective, educational path and area. Unapproved activities SHALL NOT count. Dirigentes SHALL NOT appear, since they have no objectives.

#### Scenario: Objective with activities
- **WHEN** three approved activities and one unapproved activity are linked to `4E.1.1` for Lobitos
- **THEN** the coverage of `4E.1.1` for Lobitos is 3

#### Scenario: Shared objective
- **WHEN** `3A.3-4` has two activities linked for Exploradores and one for Caminheiros
- **THEN** the row shows 2 for Exploradores and 1 for Caminheiros

### Requirement: Gaps first
The page SHALL list the objectives with no coverage, grouped by area and division, and SHALL allow showing only gaps. The totals SHALL state how many objectives are covered, how many are not, and the share covered, per division and per area.

#### Scenario: Gap list
- **WHEN** an objective has no approved activity for a division it belongs to
- **THEN** it appears in the gap list for that division

#### Scenario: Totals
- **WHEN** 160 of 173 objective-division pairs have at least one activity
- **THEN** the page shows 160 covered, 13 uncovered and 92.5%

### Requirement: Coverage of desafios
For each *desafio* the page SHALL show the number of approved activities linked to it, per division, with the *desafios* that are mandatory for integration marked, and SHALL list the *desafios* with no activity first.

#### Scenario: Mandatory desafio without activities
- **WHEN** a *desafio* that is mandatory for integration has no approved activity
- **THEN** it is listed among the gaps with the integration marker

### Requirement: Catalogue and programs lenses
The page SHALL offer two lenses: *Catálogo* counts approved activities, and *Programas* counts the distinct activities that appear in at least one program, so the team can compare what exists with what leaders use. Both lenses SHALL use the same objectives and filters. The programs lens SHALL NOT show program names or owners.

#### Scenario: Used versus available
- **WHEN** an objective has 5 approved activities of which 1 is in a program
- **THEN** the catalogue lens shows 5 and the programs lens shows 1

#### Scenario: No identities
- **WHEN** the programs lens is shown
- **THEN** no program name, owner or email appears

### Requirement: Filters
The page SHALL filter by division, area, format and focus, and the figures SHALL update to match the filter.

#### Scenario: Division filter
- **WHEN** an admin selects Escoteiros
- **THEN** only Escoteiros objectives and activities are counted

### Requirement: Export
The page SHALL export the current view as an Excel file with one row per objective-division pair and the columns code, text, area, division, catalogue count and programs count. The export SHALL follow the same admin-only rule.

#### Scenario: Export
- **WHEN** an admin exports the filtered view
- **THEN** the file has one row per pair that matches the filter

### Requirement: Empty and loading states
The page SHALL show a Portuguese message while loading, on error and when the catalogue has no approved activity.

#### Scenario: Empty catalogue
- **WHEN** there are no approved activities
- **THEN** the page says there are no activities to measure and lists every objective as a gap

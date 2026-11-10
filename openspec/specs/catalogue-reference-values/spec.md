# catalogue-reference-values Specification

## Purpose
Aligns the catalogue's closed value lists and labels with the reference sheet: risk levels, divisions, group sizes, duration and the ODS icons.

## Requirements

### Requirement: Five risk levels
Physical and psychological risk SHALL each accept Baixo, Baixo a médio, Médio, Médio a alto and Alto, shown with those labels, and SHALL stay optional. Existing activities with Baixo, Médio or Alto SHALL keep their level.

#### Scenario: Intermediate level
- **WHEN** an activity is saved with physical risk *Baixo a médio*
- **THEN** it is stored and shown with that label

#### Scenario: Existing level kept
- **WHEN** the change is applied to a database with activities rated *Médio*
- **THEN** those activities are still rated *Médio*

### Requirement: Division labels
The five divisions SHALL be labelled Lobitos (6-10), Escoteiros (10-14), Exploradores (14-17), Caminheiros (17-21) and Dirigentes (21+) wherever a division name with ages is shown, and each division SHALL be shown with its branch (Alcateia, Tropa, Esquadra, Clã, Adultos) where the interface shows branches.

#### Scenario: Division filter label
- **WHEN** the division filter is shown
- **THEN** Lobitos reads "Lobitos (6-10)"

### Requirement: Group size labels
Group sizes SHALL be labelled Pequeno (2-6), Médio (7-15) and Grande (16+).

#### Scenario: Group size label
- **WHEN** an activity with a medium group is shown
- **THEN** its group size reads "Médio (7-15)"

### Requirement: Duration range
An activity SHALL keep its single duration in minutes and MAY also store a minimum and a maximum duration. When both are present the minimum SHALL NOT exceed the maximum. Where a range exists, lists and the detail view SHALL show the range, and the program builder SHALL use the single duration.

#### Scenario: Range shown
- **WHEN** an activity has minimum 20 and maximum 40 minutes
- **THEN** the detail view shows "20-40 min"

#### Scenario: Invalid range
- **WHEN** an activity is saved with minimum 40 and maximum 20
- **THEN** the save is rejected with a Portuguese message

### Requirement: ODS icons
Each of the 17 ODS SHALL use its own icon.

#### Scenario: ODS 11
- **WHEN** ODS 11 is shown
- **THEN** its icon is the ODS 11 image

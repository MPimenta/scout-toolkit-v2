# desafio-integration Specification

## Purpose
Marks the *desafios* that are mandatory for completing the first stage in a division, gives each *desafio* a short title for lists, and records the current (v1.1) links between *desafios* and objectives.

## Requirements

### Requirement: Integration marker as data
Each *desafio* SHALL store the divisions for which it is mandatory to complete the first stage (*integração*): none, one, several or all. The text of the *desafio* SHALL NOT contain the `[Integração …]` marker. The catalogue SHALL highlight such *desafios* and state which divisions they are mandatory for.

#### Scenario: Several divisions
- **WHEN** the *desafio* `VAL-D` is read
- **THEN** its integration divisions are Escoteiros, Exploradores and Caminheiros
- **AND** its text has no bracketed marker

#### Scenario: All divisions
- **WHEN** the *desafio* `VA-A` is read
- **THEN** its integration divisions are all four youth divisions

#### Scenario: No integration
- **WHEN** a *desafio* with a blank integration cell is read
- **THEN** its integration divisions are empty and no highlight is shown

### Requirement: Short titles
Each *desafio* SHALL have the sheet's short title in addition to its full text. Lists, pills and activity cards SHALL show the short title, and the detail view SHALL show the full text.

#### Scenario: Short title in a list
- **WHEN** an activity linked to `EVAS-B` is listed
- **THEN** the *desafio* shows "Participa em 3 jogos de sentidos e motricidade."

### Requirement: Links follow matrix v1.1
The links between *desafios* and objectives SHALL be the sheet's v1.1 links, which differ from v1.0 for `VAL-G`, `CC-H`, `CC-I`, `CC-M` and `CR-N`.

#### Scenario: A changed desafio
- **WHEN** the reference data is loaded
- **THEN** `CR-N` links only `4I.4`
- **AND** `VAL-G` links `1E.2`, `4C.2` and `4C.3`

### Requirement: Dataset check
The generator SHALL fail naming the *desafio*, column and code when an objective code in the sheet is not in the objectives tab, and SHALL report the *desafios* whose v1.0 and v1.1 links differ.

#### Scenario: Unknown objective in a desafio
- **WHEN** a *desafio* lists a code that is not an objective
- **THEN** the generator exits non-zero naming that *desafio* and code

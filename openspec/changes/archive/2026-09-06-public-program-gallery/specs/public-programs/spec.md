## Purpose

Lets guests and signed-in leaders browse and preview programs that the owner has marked public, without seeing anyone's private programs.

## ADDED Requirements

### Requirement: Public gallery lists only public programs

The system SHALL list programs whose `is_public` is true to any caller, including guests. Private programs SHALL NOT appear in that list. A signed-in owner's private programs SHALL continue to appear only on their own programs list, not in the public gallery.

#### Scenario: Guest sees public programs

- **WHEN** a guest opens the public gallery
- **THEN** they see programs with `is_public` true
- **AND** they do not see programs with `is_public` false

#### Scenario: Owner private program stays off the gallery

- **GIVEN** Ana has a private program and a public program
- **WHEN** Bruno opens the public gallery
- **THEN** only Ana's public program is listed

### Requirement: Search and filter the gallery

The gallery SHALL support search by program name (case-insensitive substring) and filters for duration band (derived from entries) and whether a date is set. Results SHALL paginate. Sort SHALL allow name, date, and created-at.

#### Scenario: Search by name

- **WHEN** the caller searches for "acampamento"
- **THEN** only public programs whose name contains that text are returned

#### Scenario: Filter programs without a date

- **WHEN** the caller filters to programs with no date
- **THEN** dated public programs are omitted

### Requirement: Public preview is read-only

Opening a public program SHALL show name, date, start time, author display name, entry count, total duration, and the schedule of entries. The preview SHALL NOT offer edit, delete, or export controls to a non-owner. A private program id SHALL return 404 to anyone who is not the owner (and 401 to guests).

#### Scenario: Guest previews a public program

- **WHEN** a guest opens a public program preview
- **THEN** they see the schedule and the author's name
- **AND** they do not see edit or delete actions

#### Scenario: Guest cannot open a private program

- **WHEN** a guest requests a private program by id
- **THEN** the system returns 404 and does not leak that it exists

### Requirement: Gallery metadata is in Portuguese

The gallery and preview SHALL use Portuguese labels and SHALL show program metadata already stored on the program (name, date, start time, duration, entry count, author name). The system SHALL NOT invent new brand colours for this page.

#### Scenario: Preview shows metadata

- **WHEN** a public program with a date and three entries is previewed
- **THEN** the page shows the date, start time, author name, and a duration that matches those entries

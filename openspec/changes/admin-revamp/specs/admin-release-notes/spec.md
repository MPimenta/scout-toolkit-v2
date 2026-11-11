## Purpose

Lets the admins see what each release of the Kit de Atividades delivers, and what is planned, from release notes kept in the repository.

## ADDED Requirements

### Requirement: Release notes are kept in a repository file
The release notes SHALL be kept in `docs/release-notes.md`, one section per release written as `## <versão> · <data> · <planeada|lançada>`, optionally followed by one summary line, then the categories `### Novo`, `### Melhorado` and `### Corrigido` with `- ` items. An item MAY end with `(alteração: <nome>)` naming the OpenSpec change that delivers it. The file SHALL start with the format and the rule that an archived change is added to it, or moved to *lançada*.

#### Scenario: A release with items
- **GIVEN** a section `## 2026.11 · 2026-11-11 · lançada` with items under `### Novo` and `### Corrigido`
- **WHEN** the file is read
- **THEN** one release is found with its version, date, status and the items by category

#### Scenario: A planned release
- **GIVEN** a section whose status is `planeada` and whose date is a target month
- **WHEN** the file is read
- **THEN** the release is found with the status *planeada*

### Requirement: Admins see the release notes read-only
An admin page SHALL show the releases newest first, each with its version, date, status and items grouped by category. A *planeada* release SHALL be visibly different from a *lançada* one without relying on colour alone. An item's change name SHALL be shown as plain text. Non-admins SHALL NOT see the page, and the menu entry SHALL appear only for admins, in a group called Plataforma.

#### Scenario: Admin opens the page
- **GIVEN** a file with a *lançada* and a *planeada* release
- **WHEN** an admin opens the page
- **THEN** both releases are listed newest first, each marked with its status in words
- **AND** the items are grouped under Novo, Melhorado and Corrigido

#### Scenario: Not an admin
- **WHEN** a member or a guest asks for the page
- **THEN** they do not get it, and nothing from the file is returned

### Requirement: Content is shown as text
The page SHALL print every value from the file as text. The parser SHALL read only the headings and list items defined above and SHALL NOT interpret any other markup.

#### Scenario: Markup in an item
- **WHEN** an item contains `<script>` or a link
- **THEN** the page shows it as plain text and nothing runs

### Requirement: A release can be copied as plain text
Each release SHALL offer an action that copies it as plain text (title line, then the items by category) to the clipboard.

#### Scenario: Copy a release
- **WHEN** an admin copies a release
- **THEN** the clipboard holds its heading and its items grouped by category, one per line

### Requirement: A missing or malformed file never breaks the page
If the file cannot be read the page SHALL say so. If a section cannot be understood the page SHALL show the other releases and a note about the lines that were skipped.

#### Scenario: Missing file
- **WHEN** the file is not in the deployed build
- **THEN** the page explains that the release notes are not available and the rest of the admin area works

#### Scenario: Malformed section
- **GIVEN** one section without a status
- **WHEN** the page is opened
- **THEN** the valid releases are shown and the page notes the section that was skipped

### Requirement: No personal data
The release notes SHALL describe the product only. The format has no place for names or emails of people, and the page SHALL NOT add any.

#### Scenario: Page content
- **WHEN** an admin opens the page
- **THEN** it shows only what is in the file

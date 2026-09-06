## Purpose

Lets leaders keep Portuguese as the default chrome and switch the product chrome to English from the header, without locale-prefixed URLs and without translating stored catalogue or UGC text.

## ADDED Requirements

### Requirement: Default locale is Portuguese

A first visit with no saved locale SHALL render product chrome in Portuguese. Routes SHALL stay unprefixed (`/home`, `/activities`, `/programs`, `/auth/signin`). The document language SHALL be `pt`.

#### Scenario: First visit

- **WHEN** a visitor opens `/home` with no saved locale
- **THEN** they see Portuguese chrome (for example Entrar, Atividades, Programas)
- **AND** the address has no `/pt` or `/en` prefix

### Requirement: Header control switches chrome locale

The header SHALL show a locale control next to the user widget (Entrar when signed out, avatar when signed in). The control SHALL be available to guests and signed-in users. Choosing English SHALL switch chrome (navigation, buttons, forms, empty states, and user-visible errors) to English and set the document language to `en`. Choosing Portuguese SHALL restore Portuguese chrome. The product name **Kit de Atividades** SHALL stay unchanged in both locales.

#### Scenario: Guest switches to English

- **GIVEN** a guest on `/activities` seeing Portuguese chrome
- **WHEN** they choose English in the header control
- **THEN** navigation and filter chrome are English
- **AND** the URL is still `/activities`

#### Scenario: Signed-in user switches back to Portuguese

- **GIVEN** a signed-in user whose chrome is English
- **WHEN** they choose Portuguese in the header control
- **THEN** chrome returns to Portuguese including Sair on the user menu

### Requirement: Locale choice persists across visits

The chosen locale SHALL persist so a later request in the same browser renders that chrome without the user choosing again. Clearing the saved locale SHALL fall back to Portuguese.

#### Scenario: Reload keeps English

- **GIVEN** the user chose English
- **WHEN** they reload `/programs`
- **THEN** chrome is still English

#### Scenario: No saved locale

- **WHEN** there is no saved locale
- **THEN** chrome is Portuguese

### Requirement: Stored content stays as authored

Activity titles, descriptions, educational goals, program names, ratings, and replies SHALL render as stored. Locale SHALL NOT translate or rewrite author content. Export file chrome MAY follow the active locale; exported activity and program body text SHALL stay as stored.

#### Scenario: English chrome on a Portuguese activity

- **GIVEN** an activity whose title is stored in Portuguese
- **WHEN** chrome is English
- **THEN** the title still appears as stored
- **AND** chrome around it (for example add-to-program) is English

### Requirement: Existing Portuguese tests keep their default

Automated browser tests that do not set a locale SHALL see Portuguese chrome. A dedicated locale test MAY set English. This change SHALL NOT require rewriting the existing Portuguese Playwright suite.

#### Scenario: Default e2e session

- **WHEN** a Playwright test opens the app without setting a locale
- **THEN** it sees Portuguese chrome (Entrar, Atividades)

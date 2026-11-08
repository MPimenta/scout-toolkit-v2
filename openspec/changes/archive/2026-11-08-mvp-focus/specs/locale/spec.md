## MODIFIED Requirements

### Requirement: Header control switches chrome locale

When the `english-locale` feature is on, the header SHALL show a locale control next to the user widget (Entrar when signed out, avatar when signed in). The control SHALL be available to guests and signed-in users. Choosing English SHALL switch chrome (navigation, buttons, forms, empty states, and user-visible errors) to English and set the document language to `en`. Choosing Portuguese SHALL restore Portuguese chrome. When the feature is off, the control SHALL NOT be shown and chrome SHALL be Portuguese even if a stored locale choice says English. The product name **Kit de Atividades** SHALL stay unchanged in both locales.

#### Scenario: Guest switches to English

- **GIVEN** `english-locale` is on and a guest on `/activities` sees Portuguese chrome
- **WHEN** they choose English in the header control
- **THEN** navigation and filter chrome are English
- **AND** the URL is still `/activities`

#### Scenario: Signed-in user switches back to Portuguese

- **GIVEN** `english-locale` is on and a signed-in user's chrome is English
- **WHEN** they choose Portuguese in the header control
- **THEN** chrome returns to Portuguese including Sair on the user menu

#### Scenario: Feature off with an English cookie

- **GIVEN** `english-locale` is off and the browser holds an English locale choice
- **WHEN** the user opens any page
- **THEN** chrome is Portuguese
- **AND** no locale control is shown

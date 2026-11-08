## MODIFIED Requirements

### Requirement: Locale control stays in the phone header

When the `english-locale` feature is on, at viewports under 768px the locale control SHALL remain in the top header cluster next to the user widget (Entrar or avatar). It SHALL NOT live only inside the hamburger. The lockup, locale control (when shown), user widget, and menu button SHALL stay tappable (minimum 44px target) without horizontal scroll.

#### Scenario: Phone-width guest

- **GIVEN** `english-locale` is on
- **WHEN** a phone-width guest opens `/home`
- **THEN** they can switch locale from the header without opening the menu
- **AND** Entrar and the menu button remain visible

#### Scenario: Phone-width signed-in user

- **GIVEN** `english-locale` is on
- **WHEN** a phone-width signed-in user opens any page
- **THEN** the locale control sits next to the avatar in the header
- **AND** the page does not require horizontal scroll

#### Scenario: Feature off

- **GIVEN** `english-locale` is off
- **WHEN** a phone-width user opens any page
- **THEN** the header shows the lockup, the user widget, and the menu button only

## ADDED Requirements

### Requirement: Program page fits a phone

At viewports under 768px the program page (title, actions, summary, and schedule) SHALL fit the viewport width without horizontal scroll. Program facts (date, start, entries, total) SHALL take no more than one compact block. Each schedule entry SHALL offer move up, move down, edit, and remove.

#### Scenario: Builder at 390px

- **WHEN** a signed-in owner opens their program at 390px width
- **THEN** the page does not scroll horizontally
- **AND** every action button is fully visible

#### Scenario: Remove on a phone

- **WHEN** the owner removes an entry from the phone layout
- **THEN** the entry disappears and the remaining times are recalculated

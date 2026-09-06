## ADDED Requirements

### Requirement: Locale control stays in the phone header

At viewports under 768px the locale control SHALL remain in the top header cluster next to the user widget (Entrar or avatar). It SHALL NOT live only inside the hamburger. The lockup, locale control, user widget, and menu button SHALL stay tappable (minimum 44px target) without horizontal scroll.

#### Scenario: Phone-width guest

- **WHEN** a phone-width guest opens `/home`
- **THEN** they can switch locale from the header without opening the menu
- **AND** Entrar and the menu button remain visible

#### Scenario: Phone-width signed-in user

- **WHEN** a phone-width signed-in user opens any page
- **THEN** the locale control sits next to the avatar in the header
- **AND** the page does not require horizontal scroll

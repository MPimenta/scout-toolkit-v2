## ADDED Requirements

### Requirement: Installed standalone window is usable on a phone

When the app runs in standalone display mode, content and fixed controls SHALL respect the device safe areas (notch, rounded corners, home indicator). Pages that rely on the browser back button SHALL provide an in-app back control. Links to other origins (Orgo, eAEP, GitHub) SHALL open in the system browser, and the Excel and PDF program exports SHALL still download or open.

#### Scenario: Safe areas

- **WHEN** the app is shown in standalone mode on a device with a notch
- **THEN** the header is not covered by the notch and bottom-fixed controls are not covered by the home indicator

#### Scenario: Back without a browser bar

- **WHEN** a user in standalone mode opens an activity from the catalogue
- **THEN** a visible back control returns to the catalogue with its filters kept

#### Scenario: External link

- **WHEN** a user in standalone mode selects a link to another origin
- **THEN** it opens in the system browser and the app window stays where it was

#### Scenario: Export in standalone mode

- **WHEN** a user in standalone mode selects the Excel or PDF export
- **THEN** the file is delivered without leaving the user on a blank page

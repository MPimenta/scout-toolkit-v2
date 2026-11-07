## Purpose

Gives visitors a public, plain-language privacy page that says what the product records about them and why, so tracking is never hidden.

## ADDED Requirements

### Requirement: Privacy page

The system SHALL serve a public page at `/privacy`, in Portuguese by default, linked from the footer. It SHALL state what is recorded (searches, activity views, additions to programs), that a first-party identifier cookie is used, that no IP address or user-agent is stored, that signed-in users are identified by their account, who can see the data (administrators), the purpose (aggregated statistics to improve the catalogue), the retention period (13 months), how to ask for access or deletion, and how to turn tracking off.

#### Scenario: Footer link

- **WHEN** a visitor follows "Privacidade" in the footer
- **THEN** the privacy page opens without sign-in

#### Scenario: Content

- **WHEN** the page is read
- **THEN** it names the three recorded events, the 13-month retention and the contact for data requests

### Requirement: Page follows the tracking flag

When `usage-tracking` is off, the page SHALL state that no usage data is recorded. When on, it SHALL describe the tracking above.

#### Scenario: Flag off

- **WHEN** the flag is off
- **THEN** the page says no usage data is recorded

### Requirement: Opting out

The page SHALL explain that a Global Privacy Control or Do Not Track signal disables tracking, and SHALL offer a control that sets a cookie turning tracking off for that browser.

#### Scenario: Turning tracking off

- **WHEN** a visitor presses the opt-out control
- **THEN** no further events are recorded for that browser and the visitor cookie is removed

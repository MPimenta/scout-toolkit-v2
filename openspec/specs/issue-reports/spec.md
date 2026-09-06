# issue-reports Specification

## Purpose

Lets guests and signed-in leaders send a short incident or issue report from any page, with the current page context attached, and lets admins read and close those reports in the app.

## Requirements

### Requirement: Report control is always reachable

Every page, including sign-in, SHALL show a persistent control labelled "Reportar" (English: "Report") that opens a short form without leaving the page. The control SHALL stay visible on a phone viewport and SHALL NOT use a new brand colour.

#### Scenario: Guest on activities

- **WHEN** a guest is on `/activities`
- **THEN** they can open Reportar without signing in

#### Scenario: Sign-in page

- **WHEN** a guest is on `/auth/signin`
- **THEN** Reportar is still available

#### Scenario: Phone width

- **WHEN** the viewport is 390px wide
- **THEN** Reportar remains visible and tappable

### Requirement: Short form with automatic context

The form SHALL ask for a kind (`incidente`, `conteudo`, `ideia`), a message of at least 10 characters, and an optional contact email. Guests who leave contact empty SHALL still submit. The client SHALL send the current path, locale (`pt` or `en`), and viewport size. The server SHALL store those plus the signed-in user id when a session exists. The form SHALL NOT ask the reporter to paste the URL.

#### Scenario: Signed-in report from a program

- **GIVEN** Ana is signed in on `/programs/abc`
- **WHEN** she submits kind incidente and a valid message
- **THEN** the report stores path `/programs/abc`, locale, viewport, and Ana's user id

#### Scenario: Guest without email

- **WHEN** a guest submits a valid ideia with no contact
- **THEN** the report is stored
- **AND** they see a Portuguese success message

#### Scenario: Message too short

- **WHEN** the message is under 10 characters
- **THEN** the API returns 400
- **AND** the report is not stored

### Requirement: Guests are rate-limited

Unauthenticated POSTs SHALL be limited per client address so a guest cannot flood the queue. Signed-in users SHALL have a higher limit. Excess SHALL return 429.

#### Scenario: Guest floods

- **WHEN** a guest submits more than five reports in ten minutes from the same address
- **THEN** further guest posts return 429

### Requirement: Admins work a report queue

Admins SHALL list reports newest first with kind, message, path, locale, contact or user, and status (`aberto` or `fechado`). An admin SHALL mark a report fechado. Non-admins SHALL receive 403. Guests SHALL receive 401 on admin routes. Creating a report SHALL notify existing admins through the existing notification table.

#### Scenario: Admin opens the queue

- **WHEN** an admin opens the reports page
- **THEN** they see open reports including path and kind

#### Scenario: Admin closes a report

- **WHEN** an admin marks a report fechado
- **THEN** its status is fechado
- **AND** it remains listed unless they filter to abertos

#### Scenario: Regular user hits the admin API

- **WHEN** a signed-in user with role user calls the admin reports API
- **THEN** the response is 403

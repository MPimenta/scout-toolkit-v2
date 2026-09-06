## Purpose

Lets a signed-in program owner create a matching eAEP/Orgo event from the program page, filling only the Orgo fields this app cannot map, using a server-side write token.

## ADDED Requirements

### Requirement: Owner can open the create-in-Orgo dialog

The signed-in owner of a program SHALL see a Portuguese control on `/programs/:id` to create an Orgo event. Guests and non-owners SHALL NOT see it. If `ORGO_API_TOKEN` is not configured, the control SHALL be disabled or hidden and SHALL explain that the Orgo write integration is not configured.

#### Scenario: Owner with token configured

- **GIVEN** the signed-in user owns the program and the server has an Orgo write token
- **WHEN** they open `/programs/:id`
- **THEN** they see a control to create the event in Orgo

#### Scenario: Guest

- **WHEN** a guest opens a program they do not own
- **THEN** the create-in-Orgo control is not shown

### Requirement: Dialog asks for end datetime and unit, not timezone or tickets

The dialog SHALL prefill mapped values from the program. Mapped values SHALL include program name, public flag (`is_public` → `isPublic`), and start datetime from `date` + `start_time` when both exist. The dialog SHALL ask for end date/time, location, Orgo unit, optional max capacity, and whether to publish immediately. The dialog SHALL NOT ask for timezone, ticketing, or price.

#### Scenario: Program with date and start time

- **GIVEN** a program named "Acampamento de Verão" with date and start time
- **WHEN** the owner opens the dialog
- **THEN** name and start datetime are prefilled
- **AND** end datetime, location, and unit are shown for the owner to complete
- **AND** timezone, ticketing, and price fields are not shown

#### Scenario: Program without a date

- **GIVEN** a program with a start time and no date
- **WHEN** the owner opens the dialog
- **THEN** they must enter the event start and end datetimes before submit is enabled

### Requirement: Timezone is the user's, not a dialog field

The create request SHALL use the signed-in user's timezone (IANA name from their browser or OS). The server SHALL send that value as Orgo `timezone` and SHALL interpret start and end datetimes in that zone. The dialog SHALL NOT include a timezone picker.

#### Scenario: User in Lisbon

- **GIVEN** the owner's environment timezone is `Europe/Lisbon`
- **WHEN** they submit the dialog
- **THEN** the Orgo payload uses `timezone: Europe/Lisbon`
- **AND** they were not asked to pick a timezone

#### Scenario: Timezone missing on the request

- **WHEN** the client omits a timezone
- **THEN** the server assumes `Europe/Lisbon`
- **AND** the create still proceeds if the rest of the dialog is valid

### Requirement: Unit list is the user's event-create units

The unit field SHALL be a list of Orgo units the signed-in user has the right to create events for. The owner SHALL pick one unit from that list. The server SHALL reject a unit that is not in that list. If the list is empty, the dialog SHALL explain that and SHALL NOT create an event.

#### Scenario: User can create in two agrupamentos

- **GIVEN** the signed-in user may create events in "Agrupamento 123" and "Agrupamento 456"
- **WHEN** they open the dialog
- **THEN** the unit control lists those two names
- **AND** they must choose one before submit is enabled

#### Scenario: User has no event-create unit

- **GIVEN** the signed-in user has no Orgo unit they may create events for
- **WHEN** they open the dialog
- **THEN** they see a Portuguese explanation
- **AND** submit does not create an event

### Requirement: Server creates a draft Orgo event with a write token

The create request SHALL run on the server and SHALL send `Api-Token: $ORGO_API_TOKEN` to `POST {ORGO_ISSUER}/api/v1/events`. The browser SHALL NOT receive the token. The event SHALL start as `DRAFT` unless the owner chose to publish. Ticketing SHALL always be off (`hasEventTicketing` false). The server SHALL NOT create an Orgo product or send a price. The app SHALL store the Orgo event uuid (and public URL when known) on the program.

#### Scenario: Successful create

- **GIVEN** the owner submits a valid dialog
- **WHEN** Orgo accepts the event
- **THEN** the program stores the Orgo uuid
- **AND** the page shows a link to the Orgo event instead of a second create
- **AND** the Orgo payload has ticketing disabled

#### Scenario: Token missing

- **WHEN** the server handles a create and `ORGO_API_TOKEN` is unset
- **THEN** it returns 503 and creates no Orgo event

#### Scenario: Orgo rejects the payload

- **WHEN** Orgo returns an error
- **THEN** the program is unchanged
- **AND** the owner sees a Portuguese error and can correct the dialog

### Requirement: Existing Orgo event is not duplicated

If the program already has an Orgo event uuid, the page SHALL show a link to that event and SHALL NOT create another unless the owner explicitly confirms they want a new one (out of scope: confirm-and-replace). The default is link-only.

#### Scenario: Already linked

- **GIVEN** the program has an Orgo event uuid
- **WHEN** the owner opens `/programs/:id`
- **THEN** they see a link to the existing Orgo event
- **AND** a second event is not created

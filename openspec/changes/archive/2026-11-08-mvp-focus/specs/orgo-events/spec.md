## MODIFIED Requirements

### Requirement: Unit list is the user's event-create units

The unit field SHALL be a list of Orgo units the signed-in user has the right to create events for. The server SHALL identify the user in Orgo only by an exact, case-insensitive match of their email; if no Orgo user matches exactly, the list SHALL be empty. Only active roles that grant event creation SHALL contribute units. The server SHALL NOT fall back to the user's other units when none grant event creation. The owner SHALL pick one unit from that list. The server SHALL reject a unit that is not in that list. If the list is empty, the dialog SHALL explain that and SHALL NOT create an event.

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

#### Scenario: Member roles without event rights

- **GIVEN** the signed-in user has active roles in two units, neither granting event creation
- **WHEN** they open the dialog
- **THEN** the unit list is empty and the Portuguese explanation is shown

#### Scenario: Email lookup returns someone else

- **GIVEN** Orgo's user search for the signed-in email returns only a user with a different email
- **WHEN** the server builds the unit list
- **THEN** the list is empty
- **AND** no unit of the other user is offered

#### Scenario: Ended role

- **GIVEN** the user's event-create role in "Agrupamento 456" has an end date
- **WHEN** they open the dialog
- **THEN** "Agrupamento 456" is not listed

### Requirement: Server creates a draft Orgo event with a write token

The create request SHALL run on the server and SHALL send `Api-Token: $ORGO_API_TOKEN` to `POST {ORGO_ISSUER}/api/v1/events`. The browser SHALL NOT receive the token. The server SHALL validate the request body (end after start, unit present, capacity a positive whole number when given, publish a boolean) and SHALL reject invalid input with 400 and a Portuguese message before contacting Orgo. The event SHALL start as `DRAFT` unless the owner chose to publish. Ticketing SHALL always be off (`hasEventTicketing` false). The server SHALL NOT create an Orgo product or send a price. The app SHALL store the Orgo event uuid (and public URL when known) on the program as soon as Orgo confirms the create, before any publish step.

#### Scenario: Successful create

- **GIVEN** the owner submits a valid dialog
- **WHEN** Orgo accepts the event
- **THEN** the program stores the Orgo uuid
- **AND** the dialog shows a Portuguese success message with a link to the Orgo event
- **AND** the page shows a link to the Orgo event instead of a second create
- **AND** the Orgo payload has ticketing disabled

#### Scenario: Token missing

- **WHEN** the server handles a create and `ORGO_API_TOKEN` is unset
- **THEN** it returns 503 and creates no Orgo event

#### Scenario: Orgo rejects the payload

- **WHEN** Orgo returns an error on create
- **THEN** the program is unchanged
- **AND** the owner sees a Portuguese error and can correct the dialog

#### Scenario: End before start

- **WHEN** the owner submits an end datetime earlier than the start
- **THEN** the server returns 400 with a Portuguese message
- **AND** Orgo is not contacted

#### Scenario: Publish fails after create

- **GIVEN** the owner chose to publish
- **WHEN** Orgo creates the event but rejects the publish step
- **THEN** the program stores the Orgo uuid and link
- **AND** the owner is told the event was created as a draft and must be published in eAEP
- **AND** retrying does not create a second event

### Requirement: Existing Orgo event is not duplicated

If the program already has an Orgo event uuid, the page SHALL show a link to that event and SHALL NOT create another unless the owner explicitly confirms they want a new one (out of scope: confirm-and-replace). The default is link-only. Two create requests for the same program that arrive together SHALL result in at most one Orgo event; the later request SHALL receive a conflict response.

#### Scenario: Already linked

- **GIVEN** the program has an Orgo event uuid
- **WHEN** the owner opens `/programs/:id`
- **THEN** they see a link to the existing Orgo event
- **AND** a second event is not created

#### Scenario: Double submit

- **GIVEN** a program with no Orgo event
- **WHEN** two create requests for it arrive at the same time
- **THEN** exactly one Orgo event is created
- **AND** the other request returns 409 with a Portuguese message

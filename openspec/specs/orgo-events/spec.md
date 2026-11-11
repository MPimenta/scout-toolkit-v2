# orgo-events Specification

## Purpose

Lets a signed-in program owner create a matching eAEP/Orgo event from the program page, filling only the Orgo fields this app cannot map, using a server-side write token.

## Requirements

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

The dialog SHALL open as a popup from the program page and SHALL prefill mapped values from the program. Mapped values SHALL include program name, public flag (`is_public` → `isPublic`), and start datetime from `date` + `start_time` when both exist. The dialog SHALL ask for end date/time, location and Orgo unit, and SHALL offer the optional details that Orgo accepts for events and that the signed-in user's Orgo role allows (at least max capacity and whether to publish immediately). An option the user's role does not allow SHALL NOT be shown. The dialog SHALL also offer the participants and attachment sections defined in the `orgo-event-participants` and `orgo-event-description` capabilities. The dialog SHALL NOT ask for timezone, ticketing, or price. When the owner chooses to publish, the dialog SHALL state, before the owner confirms, that publishing notifies the members of the chosen unit.

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

#### Scenario: Role without publish right

- **GIVEN** the owner's role in the chosen unit does not allow publishing events
- **WHEN** they open the dialog
- **THEN** the publish option is not shown and the event will be created as a draft
- **AND** the participants section explains that participants must be added in eAEP once the event is published there

#### Scenario: Options follow the chosen unit

- **GIVEN** the owner may publish in one unit and only draft in another
- **WHEN** they change the unit
- **THEN** the publish option appears or disappears to match the unit

#### Scenario: Publish warning

- **GIVEN** the owner switches on publishing
- **WHEN** the dialog shows the publish option
- **THEN** it says that the members of the chosen unit will be notified
- **AND** the owner confirms before the event is created

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

### Requirement: Unit list is the units of the leader's own local group

The unit field SHALL list the units of the signed-in leader's own local group: the group-level unit and its divisões and patrulhas. The server SHALL identify the leader in Orgo by the Orgo user id kept at login, never by an email search, and SHALL read their permissions from Orgo on every request. Only an active leader who holds an event permission (at local-group level or higher) SHALL get units; for anyone else the list SHALL be empty. The owner SHALL pick one unit from the list. The server SHALL reject a unit that is not in the list. If the list is empty, the dialog SHALL explain that and SHALL NOT create an event.

#### Scenario: Leader with an event permission

- **GIVEN** the signed-in leader holds an event permission and belongs to "Grupo 312 Coimbra"
- **WHEN** they open the dialog
- **THEN** the unit control lists the group-level unit first, then its divisões and patrulhas
- **AND** units of other groups are not listed

#### Scenario: Leader with higher-level permissions

- **GIVEN** the signed-in leader also holds parent-group or national event permissions
- **WHEN** they open the dialog
- **THEN** the list is still the units of their own local group

#### Scenario: User has no event permission

- **GIVEN** the signed-in user has an Orgo account but no event permission
- **WHEN** they open the dialog
- **THEN** they see a Portuguese explanation
- **AND** submit does not create an event

#### Scenario: Orgo cannot tell who the leader is

- **GIVEN** the app has no Orgo account for the signed-in user, or Orgo does not know it
- **WHEN** they open the dialog
- **THEN** the unit list is empty and the Portuguese explanation is shown

#### Scenario: Unit outside the leader's group

- **WHEN** a create request names a unit that is not in the list
- **THEN** the server returns 400 and Orgo is not contacted

### Requirement: Server creates a draft Orgo event with a write token

The create request SHALL run on the server and SHALL send `Api-Token: $ORGO_API_TOKEN` to `POST {ORGO_ISSUER}/api/v1/events`. The browser SHALL NOT receive the token. The server SHALL validate the request body (end after start, unit present, capacity a positive whole number when given, publish a boolean) and SHALL reject invalid input with 400 and a Portuguese message before contacting Orgo. The event SHALL start as `DRAFT` and SHALL be published only if the owner chose to publish and the server confirmed from Orgo that the owner's role allows it. Ticketing SHALL always be off (`hasEventTicketing` false). The server SHALL NOT create an Orgo product or send a price. The app SHALL store the Orgo event uuid and its link (`{ORGO_ISSUER}/event/<uuid>`) on the program as soon as Orgo confirms the create, before any later step. After the create, the server SHALL run the remaining steps in this order: publish, invitations, attachment. Invitations SHALL run only after the event is published, because Orgo refuses invitations to a draft. A failed step SHALL NOT remove the event or the earlier steps, SHALL be reported to the owner in Portuguese with the step name, and SHALL be retryable without creating a second event.

#### Scenario: Successful create

- **GIVEN** the owner submits a valid dialog
- **WHEN** Orgo accepts the event
- **THEN** the program stores the Orgo uuid and a link of the form `/event/<uuid>`
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
- **AND** no invitation is attempted
- **AND** retrying does not create a second event

#### Scenario: Invitations fail after publish

- **GIVEN** the owner selected participants and the event is published
- **WHEN** Orgo rejects some or all invitations
- **THEN** the program keeps the uuid and link
- **AND** the owner is told how many were added and can retry the rest
- **AND** retrying does not create a second event

#### Scenario: Publish not allowed

- **WHEN** a request asks to publish and Orgo says the owner's role does not allow it
- **THEN** the event is created as a draft and the owner is told so
- **AND** no participants are invited

#### Scenario: Correct link

- **WHEN** the program page shows the link to the Orgo event
- **THEN** it opens the event page in eAEP, not a page that does not exist

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

### Requirement: The event belongs to the owner's scope
The event SHALL be created in the unit the owner chose, and the dialog SHALL say which leaders will see it ("quem vê este evento"), based on the unit chosen (the group-level unit or a divisão), so that leaders of that scope find the event in eAEP. The app SHALL NOT create events outside the units offered to the owner. The app SHALL NOT claim that those leaders can edit the event: the event is owned by the account the write token belongs to.

#### Scenario: Scope explained
- **WHEN** the owner selects a divisão unit
- **THEN** the dialog says the event will be visible to the leaders of that unit in eAEP

### Requirement: Attendance is checked in eAEP
The program page SHALL link to the Orgo event's attendance page (`/events/attend/<uuid>`). It SHALL also show the number of participants invited and, when Orgo reports it, the number who answered "attending" (checked in on the attendance page, or said yes themselves: Orgo uses one answer for both, so the page calls them "confirmados", not "presentes") for events the owner created, using the event's counts only. Attendance SHALL NOT be copied into the app's data and the page SHALL NOT show names.

#### Scenario: Counts available
- **GIVEN** Orgo returns counts for the event
- **WHEN** the owner opens the program
- **THEN** it shows the counts (for example "12 confirmados de 15 convidados") and no names

#### Scenario: Counts not available
- **GIVEN** Orgo does not return counts for the event
- **WHEN** the owner opens the program
- **THEN** it shows the link and the sentence that attendance is checked in eAEP

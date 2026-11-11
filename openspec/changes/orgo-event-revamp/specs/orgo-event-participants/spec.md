## Purpose

Lets a leader invite members of their own scope to the Orgo event they create, choosing from the members their level allows, without the app keeping any participant data.

## ADDED Requirements

### Requirement: Participants are invitations on a published event
The app SHALL add a participant by creating an invitation for that member on the Orgo event, one invitation per member. Orgo accepts invitations only on a published event, so the participants section SHALL be available only when the event is, or will be, published by the app. If the owner's role does not allow publishing, the section SHALL NOT be shown and SHALL explain in Portuguese that participants must be added in eAEP once the event is published. A member Orgo reports as already attending SHALL count as added.

#### Scenario: Invite after publish
- **GIVEN** the owner chose to publish and selected two members
- **WHEN** the event is created
- **THEN** the event is published first
- **AND** both members are then invited

#### Scenario: Role cannot publish
- **GIVEN** the owner's role does not allow publishing in the chosen unit
- **WHEN** they open the dialog
- **THEN** no participants section is shown
- **AND** the dialog explains that participants must be added in eAEP

#### Scenario: Already attending
- **WHEN** Orgo answers that a member is already attending
- **THEN** that member counts as added and the retry does not fail

### Requirement: Picker follows the leader's level
The participants list SHALL be built by the server from Orgo, never by the browser, and SHALL depend on the signed-in leader's own permissions in Orgo. A leader who holds an event permission at local-group level or higher SHALL see the members of their own local group, with a filter by divisão. Leaders with parent-group or national permissions SHALL, for now, see the same list (their own local group); the views for the groups below a parent group, and one level higher, are out of scope here. The server SHALL NOT list members outside the leader's own local group, even though the write token could read them. A leader whose permissions or local group cannot be determined, or who holds no event permission, SHALL see no participants section.

#### Scenario: Local-group leader
- **GIVEN** a leader whose scope is local group "Grupo 312 Coimbra"
- **WHEN** they open the participants section
- **THEN** they see that group's members and a filter by divisão

#### Scenario: Leader with higher-level permissions
- **GIVEN** a leader who also holds parent-group or national event permissions
- **WHEN** they open the participants section
- **THEN** they see the members of their own local group only

#### Scenario: Scope unknown
- **GIVEN** the server cannot determine the leader's scope
- **WHEN** they open the dialog
- **THEN** no participants section is shown

### Requirement: Search and selection
The leader SHALL be able to search the list by member name or by card number (*número associativo*), and to invite everyone listed, a selection, or nobody, with nobody as the default. The list SHALL show only the member's name, divisão and card number, and the dialog SHALL show how many will be invited. At most 500 participants SHALL be accepted in one request.

#### Scenario: Search by card number
- **WHEN** the leader types a card number
- **THEN** only the member with that card number is listed

#### Scenario: Search by name
- **WHEN** the leader types part of a name
- **THEN** the members whose names match are listed

#### Scenario: Default
- **WHEN** the leader opens the dialog
- **THEN** no participant is selected

#### Scenario: Invite all in a group
- **WHEN** the leader chooses "convidar todos" for a listed group
- **THEN** every member of that group is selected and the count matches

### Requirement: Only offered participants are accepted
The server SHALL accept only participant identifiers that it offered to this leader for this scope, and SHALL reject any other with 400 before contacting Orgo.

#### Scenario: Forged identifier
- **WHEN** a request lists a member who was not offered to this leader
- **THEN** the server returns 400 and Orgo is not contacted

### Requirement: No participant data is kept
The app SHALL send participants to Orgo and SHALL NOT store, log or return their names, emails or identifiers beyond the response to the same request. Usage events SHALL record at most the number invited.

#### Scenario: After the request
- **WHEN** the event has been created with 15 participants
- **THEN** no table of the app holds any of the 15 identifiers
- **AND** server logs contain no participant names or identifiers

### Requirement: Partial failure is reported per participant count
When Orgo accepts some invitations and rejects others, the owner SHALL see how many were added and how many failed, and SHALL be able to retry the failed ones. Invitations already accepted SHALL NOT be sent again on retry.

#### Scenario: Some rejected
- **WHEN** Orgo adds 13 of 15 participants
- **THEN** the owner sees "13 de 15 adicionados" and a retry for the remaining 2

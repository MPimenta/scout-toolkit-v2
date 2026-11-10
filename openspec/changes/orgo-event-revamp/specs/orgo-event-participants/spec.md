## Purpose

Lets a leader invite the participants of an activity to the Orgo event they create, choosing from the members of their own scope only, without the app keeping any participant data.

## ADDED Requirements

### Requirement: Participant list follows the leader's rights
After a unit is chosen, the dialog SHALL list the members of that unit whom the signed-in leader is allowed to see in Orgo, as determined by the server from Orgo and not from the browser. If the leader's role in the unit does not allow seeing or inviting members, the participants section SHALL NOT be shown and SHALL explain why in Portuguese.

#### Scenario: Leader with member rights
- **GIVEN** the leader may view the members of "Divisão Escoteiros"
- **WHEN** they choose that unit
- **THEN** the dialog lists those members by name

#### Scenario: Leader without member rights
- **GIVEN** the leader may create events in a unit but not list its members
- **WHEN** they choose that unit
- **THEN** no participants section is shown
- **AND** the dialog explains that participants must be added in eAEP

### Requirement: Selecting participants
The leader SHALL be able to invite everyone in the list, a selection, or nobody, with nobody as the default. The dialog SHALL show how many will be invited and SHALL NOT list members who are not in the chosen unit.

#### Scenario: Invite all
- **WHEN** the leader chooses "convidar todos"
- **THEN** every listed member is selected and the count matches the list

#### Scenario: Default
- **WHEN** the leader opens the dialog
- **THEN** no participant is selected

### Requirement: Only offered participants are accepted
The server SHALL accept only participant identifiers that it offered for the chosen unit to this leader, and SHALL reject any other with 400 before contacting Orgo. A request SHALL carry at most 500 participants.

#### Scenario: Forged identifier
- **WHEN** a request lists a member who was not offered for the chosen unit
- **THEN** the server returns 400 and Orgo is not contacted

### Requirement: No participant data is kept
The app SHALL send participants to Orgo and SHALL NOT store, log or return their names, emails or identifiers beyond the response to the same request. Usage events SHALL record at most the number invited.

#### Scenario: After the request
- **WHEN** the event has been created with 15 participants
- **THEN** no table of the app holds any of the 15 identifiers
- **AND** server logs contain no participant names or identifiers

### Requirement: Partial failure is reported per participant count
When Orgo accepts some participants and rejects others, the owner SHALL see how many were added and how many failed, and SHALL be able to retry the failed ones.

#### Scenario: Some rejected
- **WHEN** Orgo adds 13 of 15 participants
- **THEN** the owner sees "13 de 15 adicionados" and a retry for the remaining 2

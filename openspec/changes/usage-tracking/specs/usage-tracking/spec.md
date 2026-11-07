## Purpose

Records how the catalogue is used (searches, activity views, additions to programs) for guests and signed-in leaders, in a privacy-conscious way, so admins can later analyse it.

## ADDED Requirements

### Requirement: Tracking is behind a feature flag

The system SHALL record usage events only when the `usage-tracking` feature flag is on. When it is off, no event SHALL be written, no visitor cookie SHALL be set, and the events endpoint SHALL answer 404.

#### Scenario: Flag off

- **WHEN** the flag is off and a visitor searches the catalogue
- **THEN** nothing is stored and no visitor cookie is set

#### Scenario: Flag on

- **WHEN** the flag is on and a visitor searches the catalogue
- **THEN** one `search` event is stored

### Requirement: Search events

The system SHALL record a `search` event when a visitor runs a catalogue search or applies filters, containing the search text, the filters applied (divisions, group size, effort, location, duration bounds, types, objectives, SDGs), the divisions filtered, and the number of results. An event SHALL be recorded once per settled search, not once per keystroke, and an empty search with no filters SHALL NOT be recorded.

#### Scenario: Typing a query

- **WHEN** a visitor types "jogo" and the results load
- **THEN** one event is stored with text "jogo" and the result count

#### Scenario: Division filter

- **WHEN** a visitor filters by Escoteiros and Exploradores
- **THEN** the event lists both divisions

#### Scenario: Nothing to search

- **WHEN** the catalogue opens with no text and no filters
- **THEN** no search event is stored

#### Scenario: No results

- **WHEN** a search returns zero activities
- **THEN** the event is stored with a result count of 0

### Requirement: Activity view events

The system SHALL record an `activity_view` event when a visitor opens an activity's detail page, identifying the activity. Reloading the same page within 30 minutes by the same visitor SHALL NOT create another event.

#### Scenario: Opening an activity

- **WHEN** a visitor opens an activity
- **THEN** one `activity_view` event is stored for that activity

#### Scenario: Reload

- **WHEN** the same visitor reloads that page 5 minutes later
- **THEN** no second event is stored

### Requirement: Program addition events

The system SHALL record a `program_add` event, from the server, when an activity is added to a program, identifying the activity and the program. The event SHALL be recorded only after the entry was created successfully, and SHALL NOT be accepted from the browser.

#### Scenario: Adding to a program

- **WHEN** a signed-in leader adds an activity to a program
- **THEN** one `program_add` event is stored with the activity and program ids and the user

#### Scenario: Failed addition

- **WHEN** adding the activity fails validation
- **THEN** no `program_add` event is stored

#### Scenario: Forged event

- **WHEN** the browser posts a `program_add` event to the events endpoint
- **THEN** the request is rejected with a Portuguese validation error and nothing is stored

### Requirement: Visitor identity

The system SHALL identify a visitor by a random first-party identifier stored in a cookie that is not readable by scripts and expires after 13 months. Signed-in events SHALL also carry the user id. When a visitor signs in, events already recorded for that visitor id SHALL become attributable to that user. The identifier SHALL NOT be derived from the IP address, the user-agent or any fingerprint, and SHALL NOT be shared with third parties.

#### Scenario: First visit

- **WHEN** a visitor with no cookie triggers an event
- **THEN** a new random identifier is created, stored in the cookie and saved with the event

#### Scenario: Returning visitor

- **WHEN** the same browser triggers another event
- **THEN** the same identifier is saved

#### Scenario: Signing in

- **WHEN** a visitor with earlier anonymous events signs in
- **THEN** those events are attributed to the user, and later events carry the user id

### Requirement: Data minimisation

The system SHALL NOT store IP addresses, user-agent strings, referrers, or any identifier other than the visitor id and the user id. User names SHALL NOT be copied into events; they are read from the user record when an admin views the data.

#### Scenario: Stored fields

- **WHEN** an event is stored
- **THEN** it contains only its type, time, visitor id, optional user id and the payload for its type

### Requirement: Bots and privacy signals are not recorded

The system SHALL NOT record events from requests that identify themselves as crawlers, monitors or headless test tools, and SHALL NOT record events when the request carries a Do Not Track or Global Privacy Control signal or the visitor has opted out.

#### Scenario: Crawler

- **WHEN** a known crawler opens an activity
- **THEN** no event is stored

#### Scenario: Privacy signal

- **WHEN** a browser sends Global Privacy Control
- **THEN** no event is stored and no visitor cookie is set

### Requirement: Collection is validated server-side

The events endpoint SHALL accept only `search` and `activity_view` events, validate every field with a schema, bound text length (200 characters for search text), reject unknown activity ids, and answer with Portuguese error messages. It SHALL be rate-limited per visitor, and a failure to record SHALL NOT break the page the visitor is using.

#### Scenario: Invalid payload

- **WHEN** an event has an unknown type or a malformed activity id
- **THEN** the endpoint answers 400 with a Portuguese message and stores nothing

#### Scenario: Recording fails

- **WHEN** the database is unavailable while recording a view
- **THEN** the activity page still loads normally

### Requirement: Retention

The system SHALL delete usage events older than 13 months through a scheduled purge. The purge SHALL be idempotent and SHALL log how many events it removed.

#### Scenario: Old events

- **WHEN** the purge runs and an event is 14 months old
- **THEN** that event is deleted and a 2-month-old event is kept

### Requirement: Access to events

Usage events SHALL be readable only by administrators, through server-side queries. No HTTP endpoint SHALL return recorded events, so guests and non-admin leaders cannot read any event, including their own. The catalogue SHALL remain open without sign-in.

#### Scenario: No read endpoint

- **WHEN** anyone requests the events endpoint with GET
- **THEN** no event is returned

#### Scenario: Guest browsing

- **WHEN** a guest browses, searches and opens activities
- **THEN** no sign-in is requested

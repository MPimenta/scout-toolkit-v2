# feature-flags Specification

## Purpose
Lets the team ship a focused MVP by switching secondary features off per environment, without deleting their code or data, and switch them back on later.

## Requirements

### Requirement: Named flags for non-MVP features

The system SHALL recognise these feature flags: `english-locale`, `public-programs`, `activity-proposals`, `edit-suggestions`, `review-discussion`, `activities-table-view`, `admin-taxonomies`, `api-docs`, `issue-reports`. Each flag SHALL be enabled only when the environment lists it. The value `all` SHALL enable every flag. An unknown name SHALL be ignored. When the environment lists nothing, every flag SHALL be off.

#### Scenario: Default environment

- **GIVEN** no feature list is configured
- **WHEN** the app starts
- **THEN** all nine flags are off

#### Scenario: Enable one feature

- **GIVEN** the feature list is `public-programs`
- **WHEN** the app starts
- **THEN** only `public-programs` is on

#### Scenario: Enable everything

- **GIVEN** the feature list is `all`
- **WHEN** the app starts
- **THEN** all nine flags are on

### Requirement: Off means hidden, not deleted

When a flag is off, its navigation entries, buttons, and links SHALL NOT be shown. Its pages SHALL return the standard not-found page. Its API routes SHALL return 404. Its database tables and rows SHALL stay unchanged. Turning the flag back on SHALL restore the feature with its existing data.

#### Scenario: Public gallery off

- **GIVEN** `public-programs` is off
- **WHEN** a user opens `/programs/public`
- **THEN** they see the not-found page
- **AND** "Programas públicos" is not in the header or the phone menu

#### Scenario: API of a hidden feature

- **GIVEN** `activity-proposals` is off
- **WHEN** a signed-in user sends `POST /api/activities`
- **THEN** the response is 404
- **AND** no activity is created

#### Scenario: Data survives

- **GIVEN** `edit-suggestions` was on and users submitted suggestions
- **WHEN** the flag is turned off and later on again
- **THEN** the earlier suggestions are still listed

### Requirement: Flag scope

Each flag SHALL cover these surfaces:

- `english-locale`: the header locale control; the app renders Portuguese chrome while it is off, whatever locale cookie the user has.
- `public-programs`: the public gallery, public program preview, "use as template" copy, the public toggle in program forms, and their APIs.
- `activity-proposals`: Propor atividade, As minhas propostas, and the member endpoints that create or list their own proposals.
- `edit-suggestions`: the suggestion form on activity pages, notifications, the admin suggestion queue, and their APIs.
- `review-discussion`: votes, reactions, and replies on reviews, and their APIs.
- `activities-table-view`: the Mosaicos/Tabela toggle and the table view.
- `admin-taxonomies`: the admin taxonomy pages, their dashboard link, and the admin taxonomy APIs. The public read-only taxonomy lists used by filters SHALL stay available.
- `api-docs`: the Swagger UI, the OpenAPI JSON, and the metrics endpoint. The health endpoint SHALL stay available.
- `issue-reports`: the Reportar control on every page, the admin report queue and its dashboard link, and the report APIs (public and admin).

#### Scenario: Review discussion off

- **GIVEN** `review-discussion` is off
- **WHEN** a user opens an activity with reviews
- **THEN** each review shows its stars, comment, author, and date
- **AND** no vote, reaction, or reply controls are shown

#### Scenario: Taxonomies off, filters still work

- **GIVEN** `admin-taxonomies` is off
- **WHEN** a guest opens the activity filters
- **THEN** activity types, SDGs, and educational goals still load

### Requirement: MVP features are never flagged

Orgo sign-in, activity browsing and detail, star rating with comment, the program builder with export, creating an Orgo event from a program, and admin management of activities and users SHALL NOT depend on any feature flag.

#### Scenario: All flags off

- **GIVEN** every flag is off
- **WHEN** a signed-in leader rates an activity, adds it to a program, and creates the Orgo event
- **THEN** each step works as specified in its own capability

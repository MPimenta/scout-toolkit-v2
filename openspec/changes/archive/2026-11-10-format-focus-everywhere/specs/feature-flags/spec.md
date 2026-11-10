## MODIFIED Requirements

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
- **THEN** activity formats, activity focuses, SDGs, and educational goals still load

## Purpose

Persists admin vs user on the Auth.js account and gives admins a gated dashboard; everyone else is kept out of admin surfaces.

## ADDED Requirements

### Requirement: Role is stored on the Auth.js user

Each Auth.js `"user"` row SHALL have a `role` of `user` or `admin`, default `user`. The session SHALL expose that stored role. The unused `users` and `user_roles` tables SHALL NOT be the source of admin identity.

#### Scenario: New sign-in is a regular user

- **WHEN** a new leader signs in through Orgo
- **THEN** their stored role is `user`
- **AND** the session role is `user`

#### Scenario: Stored admin is admin in session

- **GIVEN** a user whose stored role is `admin`
- **WHEN** they establish a session
- **THEN** the session role is `admin`

### Requirement: Admin routes reject non-admins

`/admin` and `/api/admin/*` SHALL require a signed-in user whose role is `admin`. Guests SHALL receive 401 (API) or be sent to sign-in (pages). Signed-in non-admins SHALL receive 403 and a Portuguese forbidden page. Non-admin UI SHALL NOT show an Admin navigation link.

#### Scenario: Regular user opens /admin

- **WHEN** a signed-in user with role `user` opens `/admin`
- **THEN** they see a forbidden page and not the dashboard

#### Scenario: Guest hits an admin API

- **WHEN** a guest calls `/api/admin/stats`
- **THEN** the response is 401

#### Scenario: Admin opens /admin

- **WHEN** a signed-in admin opens `/admin`
- **THEN** they see the dashboard

### Requirement: Dashboard shows counts and links

The dashboard SHALL show counts for activities, users, public programs, and pending items (unapproved activities and pending edit suggestions, each zero when those queues are empty). It SHALL link to admin areas that exist then (activities, taxonomies, users) without requiring those areas to be implemented in this change.

#### Scenario: Empty platform

- **WHEN** an admin opens the dashboard on an empty database
- **THEN** counts are zero and the page still renders

#### Scenario: Counts match data

- **GIVEN** 10 approved activities and 2 unapproved
- **WHEN** an admin views the dashboard
- **THEN** the activity count is 12 and the pending-activity count is 2

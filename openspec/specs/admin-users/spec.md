# admin-users Specification

## Purpose

Lets admins list Auth.js accounts, change `user` vs `admin`, and see simple usage counts without a second user table.

## Requirements

### Requirement: List Auth.js users

An admin SHALL list users from the Auth.js `"user"` table with name, email, role, and created time. The unused `users` table SHALL NOT be listed. Non-admins SHALL receive 403. Results SHALL paginate and SHALL allow search by name or email.

#### Scenario: Admin lists users

- **WHEN** an admin opens user management
- **THEN** they see each Auth.js user and their role

#### Scenario: Regular user cannot list

- **WHEN** a user with role `user` calls the admin users API
- **THEN** the response is 403

### Requirement: Assign role

An admin SHALL set another user's role to `user` or `admin`. The change SHALL take effect on that user's next session load. An admin SHALL NOT demote the last remaining admin (409). An admin MAY demote themselves only when at least one other admin remains.

#### Scenario: Promote to admin

- **WHEN** an admin sets Bruno's role to `admin`
- **THEN** Bruno's stored role is `admin`

#### Scenario: Last admin protected

- **GIVEN** only Ana is admin
- **WHEN** Ana sets her role to `user`
- **THEN** the API returns 409 and Ana stays admin

### Requirement: Per-user usage counts

The user detail or list row SHALL show how many programs that user owns and how many reviews they wrote. When user-generated activities exist, it SHALL also show how many activities they created. Counts SHALL be zero rather than omitted when the user has none.

#### Scenario: User with no programs

- **WHEN** an admin views a user who never created a program
- **THEN** the program count is 0

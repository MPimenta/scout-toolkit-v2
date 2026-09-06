# admin-taxonomies Specification

## Purpose

Lets admins maintain activity types, educational areas, educational goals, and SDGs (including icons) without a code deploy.

## Requirements

### Requirement: Admin CRUD for the four catalogue taxonomies

An admin SHALL create, update, and delete activity types, educational areas, educational goals, and SDGs. Public GET taxonomy endpoints SHALL stay readable by guests. Non-admins SHALL receive 403 on writes. Educational goal `area_id` SHALL reference an existing area. SDG `number` SHALL be unique in 1–17. Area and goal `code` SHALL stay unique.

#### Scenario: Admin adds a goal to an area

- **WHEN** an admin creates a goal with a valid `area_id` and unique code
- **THEN** the public educational-goals list includes it

#### Scenario: Duplicate SDG number

- **WHEN** an admin creates an SDG whose number already exists
- **THEN** the API returns 409 or 400 and stores nothing

#### Scenario: Non-admin write

- **WHEN** a regular user posts a new activity type
- **THEN** the API returns 403

### Requirement: Icon management

Areas, goals, and SDGs SHALL keep an `icon` (emoji or short text). SDGs SHALL also accept `icon_url`. The system SHALL NOT invent new brand colour tokens for icons. Official SDG artwork colours SHALL be left as provided by the URL.

#### Scenario: Update area icon

- **WHEN** an admin sets an area icon to a different emoji
- **THEN** activity cards that show that area use the new icon

### Requirement: Referential delete rules

Deleting an activity type that is still referenced by an activity SHALL return 409. Deleting an SDG or goal that is still linked to an activity SHALL return 409. Deleting an educational area SHALL cascade to its goals only when those goals are unreferenced; otherwise the delete SHALL return 409.

#### Scenario: Cannot delete a type in use

- **GIVEN** an activity whose type is "Jogos"
- **WHEN** an admin deletes that type
- **THEN** the API returns 409 and the type remains

## ADDED Requirements

### Requirement: Ingested activities carry their origin into review

An activity created from an ingest batch SHALL be unapproved, SHALL show its source label, source URL and import batch to admins in the activity list and edit screen, and SHALL be filterable as "from import". Approving it SHALL follow the existing approval rules.

#### Scenario: Admin filters imported activities

- **WHEN** an admin filters the activity list by "from import"
- **THEN** only activities created from ingest batches are shown, with their batch and source

#### Scenario: Approve an imported activity

- **WHEN** an admin approves an imported activity
- **THEN** it appears in the public catalogue like any approved activity

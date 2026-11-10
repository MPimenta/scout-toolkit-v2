## ADDED Requirements

### Requirement: Usage page inside the statistics area
The usage page SHALL be reached from an admin *Estatísticas* entry that also links to coverage and ranking, with the same admin-only rule and the same figures. The former address SHALL redirect to the new one. The usage views SHALL stay behind the `usage-tracking` feature; with it off, coverage and ranking SHALL remain available.

#### Scenario: Old address
- **WHEN** an admin opens the former usage address
- **THEN** they land on the usage view in the statistics area

#### Scenario: Tracking off
- **WHEN** the `usage-tracking` feature is off
- **THEN** *Estatísticas* shows coverage and ranking and no usage view

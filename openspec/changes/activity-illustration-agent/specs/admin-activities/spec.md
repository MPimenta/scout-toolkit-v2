## ADDED Requirements

### Requirement: Admins manage generated illustrations

The activity edit screen SHALL show the current image and any generated illustration proposal, and SHALL let an admin accept it, reject it, request a regeneration with a note, or upload a replacement image. Accepting a proposal SHALL set the activity's image to the generated PNG.

#### Scenario: Accept a generated illustration

- **WHEN** an admin accepts a proposed illustration
- **THEN** the activity shows that image in the catalogue

#### Scenario: Upload replaces a proposal

- **WHEN** an admin uploads their own image while a proposal is pending
- **THEN** the uploaded image becomes the activity image and the proposal is closed as rejected

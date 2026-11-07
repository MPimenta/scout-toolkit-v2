## ADDED Requirements

### Requirement: Uploads are verified before they are switched on

Image upload SHALL be offered to users in a hosted environment only after a signed-in upload has been shown to work there: the image is stored, appears on the activity card and detail page, a guest is refused, and the image is still served after the application restarts.

#### Scenario: Switching uploads on

- **WHEN** uploads are about to be enabled for users in an environment
- **THEN** the hosted check above has been completed and recorded for that environment

#### Scenario: Guest in the hosted environment

- **WHEN** a guest sends an image to the upload endpoint in the hosted environment
- **THEN** the answer is 401 and nothing is stored

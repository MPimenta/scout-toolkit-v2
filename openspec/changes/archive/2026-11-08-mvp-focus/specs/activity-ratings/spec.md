## MODIFIED Requirements

### Requirement: Activity page shows stars and history

The activity detail page SHALL show a 1–5 star control, an optional comment, the current average and count, and a list of existing reviews. Each review SHALL show its rating, comment, author, and date. When the `review-discussion` feature is on, each review SHALL also show the vote score, reactions, and a collapsible reply thread. Submit SHALL be disabled until a star is chosen and the user is signed in, and the form SHALL say in Portuguese what is missing. The reviews section SHALL appear directly after the activity's key facts and materials, before educational goals and SDGs.

#### Scenario: Submit from the page

- **GIVEN** a signed-in user on an activity
- **WHEN** they choose 3 stars and submit
- **THEN** the list and average refresh to include their review

#### Scenario: Review renders as a post

- **GIVEN** `review-discussion` is on and an activity has one review with replies
- **WHEN** the activity page renders
- **THEN** that review shows vote and reaction controls and a collapsed thread control

#### Scenario: Plain review in the MVP

- **GIVEN** `review-discussion` is off and an activity has one review
- **WHEN** the activity page renders
- **THEN** the review shows stars, comment, author, and date
- **AND** no vote, reaction, or reply controls are shown

#### Scenario: No star chosen yet

- **GIVEN** a signed-in user who has typed a comment but chosen no star
- **WHEN** they look at the form
- **THEN** submit is disabled and the form says a rating is required

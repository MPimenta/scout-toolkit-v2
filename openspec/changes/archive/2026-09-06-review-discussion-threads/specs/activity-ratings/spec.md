## MODIFIED Requirements

### Requirement: Public averages

`GET /api/activities/{id}/ratings` SHALL return `{ average, count, reviews }` for an existing activity without requiring auth. When a session is present, the payload SHALL include `mine` (the caller's review or null). Each review SHALL include a discussion summary: vote score, the caller's vote when signed in, reaction counts, the caller's reaction when signed in, and reply count. Full reply bodies MAY be omitted until the thread is requested.

#### Scenario: Empty activity

- GIVEN an activity with no reviews
- WHEN GET is called
- THEN `average` is `0`, `count` is `0`, and `reviews` is `[]`

#### Scenario: Signed-in reader

- GIVEN the caller already reviewed the activity
- WHEN GET is called with their session
- THEN `mine.rating` matches that stored review

#### Scenario: Discussion summary on a review

- GIVEN a review with 2 upvotes, 1 `gosto` reaction, and 3 replies
- WHEN GET is called
- THEN that review includes score `2`, reaction count `gosto: 1`, and reply count `3`

### Requirement: Activity page shows stars and history

The activity detail page SHALL show a 1–5 star control, the current average and count, and a list of existing reviews as discussion posts. Each post SHALL show the rating, comment, vote score, reactions, and a collapsible reply thread. Submit SHALL be disabled until a star is chosen and the user is signed in.

#### Scenario: Submit from the page

- GIVEN a signed-in user on an activity
- WHEN they choose 3 stars and submit
- THEN the list and average refresh to include their review

#### Scenario: Review renders as a post

- GIVEN an activity with one review that has replies
- WHEN the activity page renders
- THEN that review shows vote and reaction controls and a collapsed thread control

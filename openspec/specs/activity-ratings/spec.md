# activity-ratings Specification

## Purpose

Lets leaders rate catalogue activities with a single 1–5 review each, and shows everyone the average, count, and review history on the activity page.

## Requirements

### Requirement: One review per user per activity

The system SHALL store at most one review per authenticated user and activity. A later submit from the same user SHALL update that review.

#### Scenario: First rating

- GIVEN a signed-in user and an existing activity
- WHEN they POST rating `4` with an optional comment
- THEN the review is stored and the response is 201

#### Scenario: Update own rating

- GIVEN that user already reviewed the activity
- WHEN they POST rating `5`
- THEN the same review is updated and the response is 200

### Requirement: Rating validation

A rating SHALL be an integer from 1 to 5. Invalid payloads SHALL return 400. Unauthenticated POST SHALL return 401. Unknown activity ids SHALL return 404.

#### Scenario: Out of range

- GIVEN a signed-in user
- WHEN they POST rating `6` or `0`
- THEN the API returns 400 and stores nothing

#### Scenario: Anonymous submit

- GIVEN no session
- WHEN they POST a rating
- THEN the API returns 401

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

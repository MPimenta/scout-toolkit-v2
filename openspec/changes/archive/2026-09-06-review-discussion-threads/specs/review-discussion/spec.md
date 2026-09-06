## Purpose

Lets leaders treat each activity evaluation as a discussion post: vote it up or down, react with an emoji, and hold a single-level reply thread underneath.

## ADDED Requirements

### Requirement: Upvote or downvote an evaluation

A signed-in user SHALL cast at most one vote on a given evaluation: up, down, or none. Posting the same vote again SHALL clear it. Posting the other vote SHALL replace it. Guests SHALL receive 401. The public score SHALL be (upvotes − downvotes). Replies SHALL NOT have up/down votes.

#### Scenario: First upvote

- GIVEN a signed-in user and an existing evaluation
- WHEN they upvote it
- THEN their vote is `up` and the score increases by 1

#### Scenario: Toggle off

- GIVEN that user already upvoted
- WHEN they upvote again
- THEN the vote is removed and the score decreases by 1

#### Scenario: Flip vote

- GIVEN that user upvoted
- WHEN they downvote
- THEN their vote is `down` and the score is 2 lower than after the upvote

#### Scenario: Guest vote

- GIVEN no session
- WHEN they POST a vote
- THEN the API returns 401 and stores nothing

### Requirement: Emoji reactions on evaluations and replies

A signed-in user SHALL set at most one reaction on a given evaluation or reply. The allowed keys are `gosto`, `adorei`, `haha`, `wow`, and `triste`. Setting a different key SHALL replace the previous one. Setting the same key again SHALL clear it. Guests SHALL receive 401. Unknown keys SHALL return 400. The public payload SHALL include per-key counts and the caller's current key when signed in.

#### Scenario: React to an evaluation

- GIVEN a signed-in user and an existing evaluation
- WHEN they react with `adorei`
- THEN that evaluation's `adorei` count is 1 and `mine` is `adorei`

#### Scenario: Change reaction

- GIVEN that user already reacted `adorei`
- WHEN they react with `haha`
- THEN `adorei` is 0, `haha` is 1, and `mine` is `haha`

#### Scenario: React to a reply

- GIVEN a signed-in user and an existing reply
- WHEN they react with `gosto`
- THEN that reply's `gosto` count is 1

### Requirement: Single-level reply thread

A signed-in user SHALL post a plain-text reply under an evaluation. Replies SHALL belong to that evaluation only. A reply-to-reply SHALL be stored as a sibling in the same thread, optionally starting with an @mention of the target author. The system SHALL NOT nest replies. Empty or over-2000-character bodies SHALL return 400. Guests SHALL receive 401.

#### Scenario: First reply

- GIVEN a signed-in user and an existing evaluation
- WHEN they post "Também usei isto no agrupamento"
- THEN the thread has one reply and the evaluation's reply count is 1

#### Scenario: Reply to a reply stays flat

- GIVEN a thread with reply A by Ana
- WHEN Bruno replies to A
- THEN the thread has two siblings and Bruno's body may mention Ana
- AND neither reply has children

#### Scenario: Guest reply

- GIVEN no session
- WHEN they POST a reply
- THEN the API returns 401

### Requirement: Own replies can be edited or deleted

The author SHALL update or delete their own reply. Another user SHALL receive 403. Deleted replies SHALL disappear from the thread and from reaction totals.

#### Scenario: Author deletes

- GIVEN Ana wrote a reply
- WHEN she deletes it
- THEN the thread no longer lists that reply

#### Scenario: Other user cannot delete

- GIVEN Ana wrote a reply
- WHEN Bruno tries to delete it
- THEN the API returns 403 and the reply remains

### Requirement: Collapsible thread on the activity page

Each evaluation card SHALL show vote controls, reaction counts, and a control that expands or collapses its reply thread. The thread SHALL start collapsed when it has replies, showing the reply count. Expanding SHALL list replies oldest-first. Guests SHALL see the thread and counts, and SHALL see a sign-in prompt instead of write controls.

#### Scenario: Collapse by default

- GIVEN an evaluation with 3 replies
- WHEN the activity page renders
- THEN the replies are hidden and the control reads the reply count

#### Scenario: Expand thread

- GIVEN that collapsed thread
- WHEN the user expands it
- THEN the 3 replies appear in created-at order

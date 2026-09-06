## Why

Epic 7.1 persists a star rating and an optional comment, but the activity page still treats that as a static list. Leaders cannot agree, react, or talk under an evaluation. That conversation is how a catalogue activity becomes trustworthy.

## What Changes

- Treat each evaluation as a Facebook-style post: stars + comment stay the body; peers can upvote/downvote, react with an emoji, and open a single-level reply thread
- Replies stay one level deep. A "reply to a reply" is posted as a sibling in the same thread (optional @mention), never a nested tree
- Each thread is collapsible under its evaluation
- Replies can be reacted to or replied-to (same thread). They do not get up/down votes
- Guests can read votes, reactions, and threads. Only signed-in users write them
- This **replaces** the old Story 7.2 plan (standalone comments, rich text, moderation). Those are out of scope here

## Capabilities

### New Capabilities

- `review-discussion`: Votes, emoji reactions, and one-level reply threads on activity evaluations

### Modified Capabilities

- `activity-ratings`: Review cards on the activity page become discussion posts (score, reactions, collapsible thread), not a flat comment list

## Impact

- Schema: new tables for votes, reactions, and replies; stable review id for foreign keys (`reviews.id` is today optional and not unique)
- API: vote/reaction/reply routes under `/api/activities/[id]/ratings/...`; ratings GET grows a discussion summary
- UI: `ActivityRating` and new thread/reaction controls (Portuguese)
- Tests: unit + integration for the new routes and the post/thread UI
- Roadmap: `docs/planning.md` Story 7.2 is rewritten to this change

## Context

See proposal.md for why. Epic 7.1 already persists one review per user (`reviews`, composite PK `(activity_id, user_id)`) and renders it as a flat card in `ActivityRating`. The public review `id` is synthetic (`activityId:userId`). `reviews.id` exists in Drizzle as an optional UUID and is **not** unique, so it cannot be a foreign key target yet. Auth ids live in Auth.js `user`. Tests that need Postgres use `scout_toolkit_test` only — never Neon.

## Goals / Non-Goals

**Goals:**

- Give each review a stable UUID so votes, reactions, and replies can reference it
- Keep star average logic unchanged; discussion is additive
- Load discussion summaries with the existing ratings GET; load reply bodies when a thread is expanded
- Portuguese UI, optimistic writes, no new brand colours

**Non-Goals:**

- Nested reply trees, rich text, or a separate comments area on the activity
- Moderation queue, notifications, or realtime (no websockets)
- Voting on replies
- Changing the 1–5 star model or one-review-per-user rule

## Decisions

### 1. Unique `reviews.id` as the public review id

Make `reviews.id` `NOT NULL UNIQUE DEFAULT gen_random_uuid()` (composite PK stays). The ratings API `id` becomes that UUID instead of `activityId:userId`.

Alternatives: keep the synthetic id and key child rows by `(activity_id, review_user_id)`. Rejected — every join and FK becomes a composite, and the UI already treats `id` as the review key.

### 2. Three child tables, two reaction tables

```
reviews.id  <--+-- review_votes     (review_id, user_id)  value: up | down
               +-- review_reactions (review_id, user_id)  key: gosto|adorei|haha|wow|triste
               +-- review_replies   id, review_id, user_id, body, mention_user_id?
                      |
                      +-- reply_reactions (reply_id, user_id)  same keys
```

Separate reaction tables keep real FKs. A polymorphic `(target_type, target_id)` table was rejected because Postgres cannot enforce the parent without extra checks.

`mention_user_id` is optional. The API may also prefix the body with `@Nome` for display; storage of the mention id is enough to keep the sibling flat.

### 3. Routes under the existing ratings prefix

```
GET    /api/activities/:id/ratings                          + discussion summary per review
GET    /api/activities/:id/ratings/:reviewId/replies        thread (oldest-first)
POST   /api/activities/:id/ratings/:reviewId/vote           { value: "up" | "down" }
POST   /api/activities/:id/ratings/:reviewId/reactions      { key }
POST   /api/activities/:id/ratings/:reviewId/replies        { body, mentionUserId? }
PATCH  /api/activities/:id/ratings/:reviewId/replies/:replyId
DELETE /api/activities/:id/ratings/:reviewId/replies/:replyId
POST   /api/activities/:id/ratings/:reviewId/replies/:replyId/reactions  { key }
```

Vote and reaction POSTs are upserts (same key/value clears). Guest GET is public; writes need a session.

Alternative: one `/discussion` resource. Rejected — the post *is* the review; keep the URL next to ratings.

### 4. Collapse now, fetch replies on expand

Ratings GET includes `score`, `myVote`, `reactions`, `myReaction`, `replyCount` only. Expanding a thread calls the replies GET. Avoids loading every body on first paint.

### 5. UI stays in the activity ratings block

Extend `ActivityRating` with a review-post card (votes + reactions + thread toggle). No new page. Labels in Portuguese (`Gosto`, `Adorei`, `Responder`, `N respostas`). Same session/guest rules as 7.1.

## Risks / Trade-offs

- [Neon `reviews.id` is nullable / not unique] → Backfill UUIDs, add unique constraint, then add FKs. Apply with the same targeted SQL/`drizzle-kit push` pattern as the 7.1 user FK fix. Do not point tests at Neon.
- [Public review `id` format changes] → Only this app's client consumes it; update `toPublicReview` and component tests together.
- [Vote + reaction on the same post feels redundant] → Spec requires both; keep them. Votes rank; reactions are social.
- [Chrome/Facebook muscle memory for nested threads] → Reply-to-reply stays a sibling with @mention so depth cannot grow.

## Migration Plan

1. Backfill `reviews.id`, set NOT NULL UNIQUE
2. Create the four child tables
3. Ship API then UI
4. Rollback: drop child tables; ratings GET can ignore missing summary columns. Do not drop `reviews.id` uniqueness once clients store it.

## Open Questions

- Whether the activity list should later sort reviews by score instead of `created_at`. Default stays newest-first; changing sort does not change the spec.

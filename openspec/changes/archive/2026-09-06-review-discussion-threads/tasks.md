## 1. Persistence

- [x] 1.1 Make `reviews.id` NOT NULL UNIQUE (backfill existing rows) and verify a review can be selected by that UUID
- [x] 1.2 Add `review_votes`, `review_reactions`, `review_replies`, and `reply_reactions` in Drizzle pointing at Auth.js `user` and `reviews.id`
- [x] 1.3 Extend `tests/setup.ts` with the new tables (local `scout_toolkit_test` only) and verify setup still creates the schema
- [x] 1.4 Apply the unique id + child tables on the app database the same way as the reviews FK fix, and verify a probe insert/rollback against each new table succeeds

## 2. API

- [x] 2.1 Return a UUID `id` plus discussion summary (`score`, `myVote`, `reactions`, `myReaction`, `replyCount`) from GET `/api/activities/[id]/ratings` and verify the empty and populated cases
- [x] 2.2 Implement vote upsert/toggle on POST `.../ratings/:reviewId/vote` and verify up, toggle-off, flip, and 401
- [x] 2.3 Implement reaction upsert/clear on evaluations and replies and verify replace, toggle, unknown key 400, and 401
- [x] 2.4 Implement reply create/list/edit/delete (flat thread, optional mention) and verify oldest-first list, sibling reply-to-reply, 403 on another's delete, and 401

## 3. UI

- [x] 3.1 Render each review as a post (votes, reaction picker, reply count) in Portuguese and verify guests see counts but not write controls
- [x] 3.2 Load the thread on expand (collapsed by default) and verify replies appear oldest-first
- [x] 3.3 Let a signed-in user reply, reply-to-reply as a sibling with @mention, and edit/delete their own reply, and verify the thread updates

## 4. Tests

- [x] 4.1 Add unit tests for vote/reaction toggle helpers and review UUID mapping; verify they pass
- [x] 4.2 Add integration tests for the new routes on `scout_toolkit_test` and verify they pass without touching Neon
- [x] 4.3 Update `ActivityRating` tests for post chrome, collapse/expand, and guest vs signed-in controls; verify they pass

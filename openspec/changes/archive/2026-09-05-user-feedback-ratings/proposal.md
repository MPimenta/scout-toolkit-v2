## Why

Epic 7.1 asks for a real rating system. The activity page already renders `ActivityRating`, but there is no ratings API, no persistence, and no average. Leaders cannot leave a trustworthy score.

## What Changes

- Persist one review per user per activity in the existing `reviews` table
- Point `reviews.user_id` at the Auth.js `user` table (not the unused `users` table)
- `GET /api/activities/[id]/ratings` returns reviews, average, count, and the current user's review when signed in
- `POST /api/activities/[id]/ratings` creates or updates the caller's review (rating 1–5, optional comment)
- Activity detail shows star input, average, list, and the signed-in user's existing rating
- Unauthenticated users can read averages/list but cannot submit

## Capabilities

### New Capabilities

- `activity-ratings`: Persist, validate, average, and display activity ratings

### Modified Capabilities

- (none)

## Impact

- Schema: `drizzle/schema/feedback.ts` FK
- API: `src/app/api/activities/[id]/ratings/route.ts`
- UI: `src/components/features/activities/ActivityRating.tsx`
- Tests: unit/integration for the route and component
- No change to comments-as-a-separate-epic (7.2). Comments on a rating stay an optional field on the review row.

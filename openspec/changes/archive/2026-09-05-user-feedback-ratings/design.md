## Context

`reviews` already exists in `drizzle/schema/feedback.ts` with `rating` 1–5 and optional `comment`, unique on `(activity_id, user_id)`. The UI posts to `/api/activities/:id/ratings` but the route is missing. The FK currently targets `users`, which is not the Auth.js table.

## Goals / Non-Goals

**Goals:** persist ratings, validate, average, show history, upsert own review.

**Non-Goals:** comment threads (Epic 7.2), admin moderation UI, email notifications.

## Decisions

- Use the existing `reviews` table; change `user_id` to reference Auth.js `user.id`
- Upsert on POST (create 201 / update 200) instead of a separate PUT
- GET is public (catalogue pages are readable); POST requires session
- Average is arithmetic mean rounded to one decimal
- Load reviews on mount in `ActivityRating`; stop inventing client-only ids

## Risks / Trade-offs

- Neon needs the `reviews` table (drizzle-kit push if missing)
- Composite primary key `(activity_id, user_id)` means API `id` is a synthetic key (`activity_id:user_id`) unless we select both

## Migration Plan

1. Fix FK and push schema if the table is missing
2. Add GET/POST route
3. Wire the component
4. Unit-test the route with mocked db/auth

## 1. Persistence

- [x] 1.1 Point `reviews.user_id` at Auth.js `user`
- [x] 1.2 Ensure the reviews table is creatable in the test schema helper if needed

## 2. API

- [x] 2.1 GET `/api/activities/[id]/ratings` — average, count, reviews, mine
- [x] 2.2 POST upsert with 1–5 validation and auth

## 3. UI

- [x] 3.1 Load reviews on mount in `ActivityRating`
- [x] 3.2 Show average, count, and disable submit until a star is chosen

## 4. Tests

- [x] 4.1 Unit/integration tests for the ratings route
- [x] 4.2 Update ActivityRating tests for load + submit

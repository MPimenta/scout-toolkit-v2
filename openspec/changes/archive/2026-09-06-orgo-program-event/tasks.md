## 1. Token, schema, and mapping

- [x] 1.1 Add `ORGO_API_TOKEN` to `.env.example` (no secrets) and document minting a token with `HR_LOCAL` in `docs/deployment.md`
- [x] 1.2 Add `orgo_event_uuid` and `orgo_event_url` on `programs` and verify a SQL-integration insert on `scout_toolkit_test` only
- [x] 1.3 Implement a server mapper (program + dialog → Orgo event payload) and verify unit tests for date+start_time, missing date, last-entry end default, client timezone, `Europe/Lisbon` fallback, and `hasEventTicketing: false`

## 2. API and UI

- [x] 2.1 Add a server read of the signed-in user's Orgo event-create units (write token, mocked `user_roles`) and an authenticated POST that creates the event with `Api-Token`, never enables ticketing, returns 503 without the token, rejects a unit not on the list, and persists the uuid — verify mocked unit tests, no live Orgo calls
- [x] 2.2 Add the Portuguese control and dialog on `/programs/:id` (end datetime, location, unit select, optional capacity, publish; no timezone or ticket fields; hidden for guests; link when uuid exists) and verify a Chromium e2e that opens the dialog and sees those fields without calling Orgo

## 3. Failure paths

- [x] 3.1 Surface Orgo errors and an empty unit list in Portuguese and leave the program unlinked — verify unit tests for a mocked 4xx and for zero eligible units

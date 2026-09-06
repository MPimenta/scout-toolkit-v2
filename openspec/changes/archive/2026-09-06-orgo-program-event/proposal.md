## Why

Leaders already plan a program in Kit de Atividades, then recreate it by hand in eAEP/Orgo so the grupo can register. Orgo's write API is a separate admin `Api-Token` (at least `HR_LOCAL`) — the current OAuth login only has `profile email` and cannot create events. We need a program-page action that opens a short form for the fields we cannot map, then creates the Orgo event server-side.

## What Changes

- Add a Portuguese button on the signed-in program details page to create that program as an Orgo event
- Show a dialog for end date/time, location, optional capacity, publish now, and Orgo unit (units the signed-in user may create events for)
- Do not ask for timezone (use the user's timezone) or ticketing/price (`hasEventTicketing` is always false)
- Call Orgo from the server with `ORGO_API_TOKEN` (`Api-Token` header), never from the browser
- Persist the created event id/uuid and public URL on the program so the button becomes a link instead of creating a duplicate
- Attendee checkout, Stripe, and ticket products stay out of this change

## Capabilities

### New Capabilities

- `orgo-events`: Create an Orgo event from a Kit de Atividades program, with a dialog for unmapped fields and a write token that is not the OAuth login

### Modified Capabilities

- (none)

## Impact

- Env: `ORGO_API_TOKEN` (and existing `ORGO_ISSUER`) in `.env.example` / Vercel — never committed
- API: also a server read of the signed-in user's Orgo units (mocked in tests)
- Schema: store Orgo event uuid + url on `programs`
- API: authenticated POST that the owner (or admin) can call
- UI: program details / builder header
- Tests: unit for field mapping and missing-token 503; no live writes to eaep.escoteiros.pt in CI
- Docs: `docs/deployment.md` how to mint the token in Orgo (Developers → API Tokens, API module on)

## Why

A public gallery only helps if a leader can take a published program and make it their own. Today there is no copy: `POST /api/programs` always creates an empty program, and `GET /api/programs/[id]` 404s for anyone who is not the owner.

## What Changes

- Signed-in users can copy a public program into their own account as a private draft
- The copy includes entries (activities and custom slots) in the same order and times
- The copy is not public; the leader customises it with the existing builder
- Attribution stays on the copy (source program + original author name)
- Guests who try to copy are sent to sign-in
- Depends on `public-program-gallery` for the preview surface

## Capabilities

### New Capabilities

- `program-templates`: Copy a public program into the caller's account with attribution

### Modified Capabilities

- (none)

## Impact

- Schema: `source_program_id` (nullable FK) on `programs` for attribution
- API: copy/template endpoint; owner GET/PUT remain unchanged
- UI: "Usar como modelo" on the public preview; success toast + navigate to the new program
- Tests: copy of public vs private, guest 401, entries cloned, `is_public` false on the copy
- Roadmap: `docs/planning.md` Story 8.2

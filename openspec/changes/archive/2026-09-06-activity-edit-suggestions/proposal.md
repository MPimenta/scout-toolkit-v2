## Why

`edit_suggestions` already stores a field patch, status, and reviewer, but nothing reads or writes it. Leaders who cannot edit the catalogue have no path to propose a correction.

## What Changes

- Signed-in users suggest a change to one activity field at a time
- Admins review a queue and accept or reject; accept applies the value to the activity
- Suggestors see their own suggestion history and status
- In-app notifications (no email, no realtime) when a suggestion is submitted (admins) or decided (suggestor)
- Replaces the vague "notification system" in Story 10.1 with that inbox, not a mail product
- Depends on `admin-dashboard` for admin identity; review UI can live under `/admin`

## Capabilities

### New Capabilities

- `edit-suggestions`: Propose, review, apply or reject activity field edits, with history and in-app notices

### Modified Capabilities

- (none)

## Impact

- Schema: use existing `edit_suggestions`; add a small `notifications` table
- API: suggest + list mine + admin review
- UI: control on the activity page; admin queue; notification list
- Tests: one field, apply writes the activity, reject does not, guest 401
- Roadmap: `docs/planning.md` Story 10.1

## Why

Leaders can hit a broken filter, a wrong activity, or a Preview sign-in snag and have no in-product way to tell us. Email and GitHub are the wrong inbox for Escoteiros de Portugal. We need a short report that is always one tap away and already knows which page they were on.

## What Changes

- Add a floating “Reportar” control on every page (including auth), opening a short sheet: kind, message, optional contact
- Attach automatic context (path, locale, viewport, signed-in identity if any) so the reporter does not retype it
- Store reports in the app database and give admins a queue to read and mark done
- Notify admins in the existing in-app notification table
- Keep this distinct from activity edit suggestions (those stay field-level on one activity)
- Portuguese chrome via catalogs; English via the existing switcher. No new brand colours. No GitHub Issues, Intercom, or email delivery in this change

## Capabilities

### New Capabilities

- `issue-reports`: Floating report control, stored reports with page context, admin queue

### Modified Capabilities

- (none)

## Impact

- UI: launcher in `AppShell` (Sheet), admin page next to sugestões
- API: public POST for reports; admin list/update under `/api/admin`
- Data: new `issue_reports` table (Drizzle); reuse `notifications`
- Tests: unit + SQL-integration on `scout_toolkit_test` + Playwright on the launcher
- Unchanged: edit suggestions, ratings, Orgo, Preview hosting

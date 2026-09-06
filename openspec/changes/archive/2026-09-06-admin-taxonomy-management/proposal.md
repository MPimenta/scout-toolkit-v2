## Why

Activity types, educational areas/goals, and SDGs are read-only GET APIs plus seed data. Admins have no way to add a section, fix a goal title, or refresh an SDG icon without a deploy.

## What Changes

- Admin CRUD for educational areas, educational goals, activity types, and SDGs
- Icon management: emoji/text `icon` plus URL (`icon` / `icon_url`) — no new colour tokens
- Preserve relationships (goal belongs to an area; activities reference type/goals/SDGs)
- Block delete when the row is still referenced, or cascade only where the schema already cascades (goals under an area)
- Depends on `admin-dashboard` for admin identity
- Group size / effort / location / age-group lookup tables stay seed-only (they are enums on activities)

## Capabilities

### New Capabilities

- `admin-taxonomies`: Admin CRUD and icon fields for catalogue taxonomies

### Modified Capabilities

- (none)

## Impact

- API: admin write routes beside the existing public GET taxonomies
- UI: `/admin/taxonomias` (or equivalent Portuguese path) with tabs per taxonomy
- Tests: create/update/delete, unique code/number, referenced-row delete 409, non-admin 403
- Roadmap: `docs/planning.md` Story 9.3

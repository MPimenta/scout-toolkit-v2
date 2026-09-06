## Why

On `/programs/:id`, adding or removing an activity updates the parent state but the schedule table keeps its mount-time copy, so the row does not appear or disappear. Adding from an activity page then opening the program can also show a stale cached schedule (`entries: []` for 30s). Leaders need the page they are looking at to match the last successful add or remove without a manual reload.

## What Changes

- The program page schedule SHALL show a newly added activity (and hide a removed one) as soon as the write succeeds
- The same live update SHALL apply to custom blocks, because they share the schedule
- After adding an activity from the activity page and landing on the program, the new row SHALL be visible
- Entry writes SHALL invalidate the program detail cache so a refetch cannot restore a stale empty or old list

## Capabilities

### New Capabilities

- `program-builder`: The signed-in program page schedule stays in sync when entries are added or removed

### Modified Capabilities

- (none)

## Impact

- `ProgramScheduleTable` must follow the `entries` prop after mount (local drag state is fine until the parent sends a new list)
- `useProgramMutations.updateProgram` and `AddToProgramModal` must invalidate `queryKeys.programs.detail(id)` after entry writes
- Tests: unit (table rerender on prop change) and Playwright (add then remove on `/programs/:id`)
- Unchanged: entry API contracts, Portuguese copy, public gallery

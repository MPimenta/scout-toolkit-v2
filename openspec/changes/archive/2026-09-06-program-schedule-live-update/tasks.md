## 1. Schedule table follows parent entries

- [x] 1.1 Sync `ProgramScheduleTable` `localEntries` when the `entries` prop changes and verify a unit test: rerender with one more / one fewer entry updates the rows and empty state
- [x] 1.2 Await `onRefresh` after a successful add or remove in `ProgramBuilder` and verify a failed write still restores the previous list

## 2. Cache invalidation after entry writes

- [x] 2.1 Invalidate `queryKeys.programs.detail(id)` and lists after the entries PUT in `useProgramMutations.updateProgram` and verify the create-program unit test still passes
- [x] 2.2 Invalidate the same keys after `AddToProgramModal` POSTs an entry (before navigating) and verify the modal still redirects to `/programs/:id`

## 3. Browser coverage

- [x] 3.1 Add a Chromium-only Playwright spec: signed-in owner on `/programs/:id` adds a catalogue activity, sees its name, removes it, and sees the empty state — without reloading

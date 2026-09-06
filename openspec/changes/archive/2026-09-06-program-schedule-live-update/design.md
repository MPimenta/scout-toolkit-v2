## Context

See proposal.md. `/programs/:id` renders `ProgramBuilder` with `initialEntries` from `useProgram`. The builder keeps its own `entries` state and already calls `setEntries` plus `onRefresh` after add/remove. `ProgramScheduleTable` copies `entries` into `localEntries` on mount and never syncs, so the table stays stale. `updateProgram({ entries })` PUTs via raw `fetch` and does not invalidate `queryKeys.programs.detail(id)`. Create and Add-to-program can leave a cached program with `entries: []` (30s staleTime), so a later refetch or navigation can overwrite a correct optimistic list with an empty one.

## Goals / Non-Goals

**Goals:**

- The table (and empty state) follow the parent `entries` after add, remove, and a successful refetch
- Entry writes invalidate the program detail (and list) so refetch cannot restore a stale schedule
- Adding from the activity page then opening the program shows the new row

**Non-Goals:**

- Live updates across two browser tabs
- Changing the entries REST contract or replacing PUT-replace-all
- Collaborative/realtime editing
- Rewriting Portuguese builder copy (including the English "Program Builder" heading already on the page)

## Decisions

1. **Sync `localEntries` from the `entries` prop**  
   `useEffect(() => setLocalEntries(entries), [entries])` in `ProgramScheduleTable`. Drag-and-drop still updates local state first, then `onReorder`.  
   Alternative: drop local state and always render `entries`. Rejected because dnd-kit needs a local list during a drag.

2. **Invalidate detail after every entry write**  
   After the entries PUT in `useProgramMutations.updateProgram`, and after POST in `AddToProgramModal`, call `queryClient.invalidateQueries({ queryKey: queryKeys.programs.detail(programId) })` (and lists). Await `onRefresh` on the builder so the parent list is the server list before the table syncs.  
   Alternative: only rely on optimistic local state. Rejected because a later refetch of a stale cache wipes the row.

3. **Keep optimistic update + revert on failure**  
   Builder already adds/removes locally, persists, then refreshes; on error it restores the previous list. Keep that so a failed write does not leave a false row.

## Risks / Trade-offs

- [Risk] Syncing on every `entries` reference change could reset mid-drag if the parent recreates the array each render → Mitigation: parent `entries` is `useState`; only `setEntries` changes it.
- [Risk] Refetch after invalidate briefly shows the optimistic list then the server list → Acceptable; IDs are preserved on PUT.
- [Risk] `useAllActivities` missing the added activity shows the fallback name "Atividade" → Mitigation: seed/catalogue activities are already loaded; do not block this change on a new activity-join in the table.

## Migration Plan

Ship with the app. No schema or API migration. Rollback is a revert of the client cache/table sync.

## Open Questions

None.

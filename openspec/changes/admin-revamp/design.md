## Context

See proposal.md for why. Current state (read for this design):

- Admin pages: `/admin` (stats strip), `/admin/atividades` (list, `nova`, `[id]`), `/admin/taxonomias`, `/admin/utilizacao`, `/admin/reportes`, `/admin/sugestoes`, `/admin/utilizadores`. APIs under `/api/admin/{activities,reports,stats,suggestions,taxonomies,usage,users}`.
- The usage page already shows totals, views versus additions (top 10 each), searches and users by name, from `usage_events` (archived changes `usage-tracking`, `admin-usage-analytics`). The "tracking and tracing" idea is therefore **already built**; this change gives it a home next to the new views instead of extending the event model.
- Coverage data lives in `activity_educational_goals (activity_id, goal_id, age_group)` and `activity_challenges`; the framework tables are `educational_areas`, `educational_paths`, `general_objectives`, `educational_goals` (+ `educational_goal_age_groups`), `challenges` (+ `challenge_goals`). Programs use `programs` and `program_entries (activity_id nullable, set null on delete)`.
- With ~1,080 activities loaded (`reference-sheet-alignment`), the list and the aggregates are still small data (a few thousand link rows), so plain SQL aggregates are enough.

## Goals / Non-Goals

**Goals:**
- Answer "what do we cover, what do leaders use, where are the gaps" in the admin area with exact, explainable figures.
- Make activity management workable at ~1,000 rows.
- Keep one consistent admin navigation.

**Non-Goals:**
- No new tracking events, no per-user analytics beyond the existing page, no public statistics.
- No change to how objectives are linked to activities.
- No scheduled or emailed reports.

## Decisions

**D1. Statistics are one area with three views.** `/admin/estatisticas` holds *Utilização* (the existing page, moved), *Cobertura* and *Ranking*, sharing a header, a division filter and the period control where it applies. Old `/admin/utilizacao` redirects. *Alternative:* extend the usage page with coverage panels. Rejected: it mixes event-based figures (flagged "indicative") with exact catalogue counts, and the usage page has a feature flag the other two do not need.

**D2. Coverage is computed in SQL from links, per (objective, division).** One query returns, for every objective-division pair, `catalogue_count` (distinct approved activities with a link for that pair) and `programs_count` (distinct approved activities with a link for that pair that appear in at least one `program_entries` row). Rolling up to general objective, path and area is done from the same result in code, so the totals always add up to the rows shown. The *desafio* coverage is the same shape over `activity_challenges` (division from the *desafio*'s age group). No materialised view: the data is small; revisit if the query takes more than a few hundred milliseconds on the full set.

**D3. Two lenses, same query.** The programs lens is a join on `program_entries`, not on usage events, so it is exact and does not depend on tracking being on. It counts distinct activities, never programs or people, and returns no names.

**D4. Ranking counts distinct programs, from `program_entries`.** `COUNT(DISTINCT program_id)` per activity and `COUNT(DISTINCT programs.user_id)` for leaders, filtered by the program's creation date. This differs on purpose from the usage page's "additions" (events, which count each add action): the ranking says "in how many programs is it now", the usage page says "how often did people add it". Both labels say which.

**D5. Gap definition uses the objective's own divisions.** A pair exists only for divisions in `educational_goal_age_groups`, so shared objectives (`3A.3-4`) produce two pairs and Dirigentes none. The totals line uses pairs, which is why it reads "160 of 173 pairs" and not "of 173 objectives".

**D6. Bulk actions go through one endpoint.** `POST /api/admin/activities/bulk` with `{ action: 'approve' | 'unapprove' | 'delete', ids, force? }`, validated by Zod (max 200 ids), run in one transaction, answering with the counts or a 409 listing blockers. Single-item rules (delete blocked by programs) are reused, not reimplemented.

**D7. Server-side list.** The existing activity list endpoint gains `page`, `pageSize`, `q`, `approved`, `format`, `focus`, `division`, `source`, `missing` parameters, validated and mirrored in the page address. Completeness is computed in the same query with `EXISTS` checks, not in the browser.

**D8. Formats and focuses admin is the existing taxonomy pattern.** Same endpoints and UI shape as the other taxonomies, plus the "move then delete" action. Values from the sheet are `is_managed` and read-only, so a reload never fights a manual edit; the admin's own values are unmanaged. *Assumption to confirm:* editing the wording of a sheet value from the app is not wanted, because the sheet is the definitive reference. If it is wanted, it needs a decision on which side wins at the next load.

**D9. Privacy.** Coverage and ranking return counts and activity names only. The programs lens and the leader counts never expose program names, owners or emails, and the API does not return them even to admins.

**D10. Routes and flags.** New routes are classified in `FEATURE_ROUTES` (coverage and ranking always on for admins; usage stays under `usage-tracking`). The home stats strip stays and links to the new area.

## Risks / Trade-offs

- **Figures read as targets** (an objective with 0 activities is not necessarily a defect) → the page words them as coverage, not quality, and the export carries the filter used.
- **Heavy query on the full set** → measure on the loaded set; add indexes on `activity_educational_goals (goal_id, age_group)` and `program_entries (activity_id)` only if needed.
- **Bulk delete mistakes** → confirmation with the count, transaction, 409 on referenced activities, no force from the bulk UI in the first version.
- **Two "additions" numbers** (ranking versus usage page) → both pages state the definition next to the figure.
- **Admin copy** → Portuguese strings need approval before they are final.

## Migration Plan

No data migration. Ship behind the existing admin access; the redirect keeps old bookmarks working. Rollback is a revert: no schema depends on it (unless the optional indexes were added, which are harmless).

## Open Questions

- Should the coverage page also show the Regulamento's expected minimum per objective (a target)? Not needed for the first version; it would need a target per objective from the team.

## 1. Runner skeleton and spec loader

- [ ] 1.1 Create `agents/activity-importer/` with CLI entry, `npm run agent:import`, and flags `--spec --file --url --submit --force --out` — verify `--help` prints usage and a missing spec fails clearly
- [ ] 1.2 Add the spec loader (front matter + instructions, Zod, no unknown keys, skills must exist) — verify unit tests for valid, missing `allowHosts`, unknown skill, unknown key
- [ ] 1.3 Add `agents/specs/` and `agents/skills/`, copy and adapt `atividades-classificar`, `atividades-riscos-qualidade`, `atividades-escutismo` to emit ingest records instead of sheet rows — verify each skill file notes its origin and no step mentions Google Sheets

## 2. Safe source reading

- [ ] 2.1 Implement the safe fetcher (https, allowlist, SSRF checks incl. redirects, limits, robots.txt, rate limit) — verify unit tests with a fake DNS/redirect for private, loopback, metadata addresses and oversize bodies
- [ ] 2.2 Implement readers for PDF, xlsx, csv, docx, text and HTML-to-text — verify fixtures for each, plus the unreadable-source report
- [ ] 2.3 Implement bounded same-host crawl from the spec's `maxPages` — verify it stops at the limit and skips off-host links

## 3. Agent loop

- [ ] 3.1 Wire the Claude Agent SDK with only `read_source`, `fetch_url` and `emit_records` tools and the untrusted-data framing — verify a test source containing injection text does not change output and the transcript has no token or key
- [ ] 3.2 Share the ingest envelope schema between the app and the agent (single source in `src/lib/ingest`) and validate before emit — verify an invalid enum is reported, not emitted
- [ ] 3.3 Add per-field confidence/notes and required source quotes — verify a sample run flags an inferred duration
- [ ] 3.4 Add cost tracking, budget caps and the run report (found, submitted, skipped, low-confidence, errors, cost) — verify a tiny budget stops mid-run and still writes the report

## 4. Submit, incremental state, provenance

- [ ] 4.1 Add `--submit` posting batches of at most 50 with the service token held by the runner — verify against local dev with a token that batches arrive as pending rows (requires `bulk-activity-ingest`)
- [ ] 4.2 Add source hash state and skip-unchanged with `--force` — verify the second run of an identical source makes no model call
- [ ] 4.3 Carry `permission`, source label and URL on records — verify the values reach the staging rows

## 5. First real run and scheduling

- [ ] 5.1 Write the example spec for the first source (confirm the source with the maintainer) and do a dry run — verify the output against a hand-checked sample of at least 10 activities
- [ ] 5.2 Add `.github/workflows/agent-import.yml` (`workflow_dispatch`, optional cron, secrets, report artifact) — verify a manual dispatch uploads a report and creates only pending rows
- [ ] 5.3 Write `docs/agents.md`: how to write a spec, add a skill, get a token, run, and read a report — verify a fresh checkout can follow it to a dry run

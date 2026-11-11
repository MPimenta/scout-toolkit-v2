## Why

Activity content sits in PDFs, partner websites and spreadsheets in many shapes. Turning each into catalogue entries by hand is slow, and each new source needs its own rules about faixa etária, objectives, risks and quality. We already encode those rules as skills (`atividades-classificar`, `atividades-riscos-qualidade`, `atividades-escutismo`). An agent that reads a source, applies those skills, and delivers structured records lets us ingest a new source by writing a spec instead of writing code, and rerun it whenever the source changes.

## What Changes

- Add a **runnable import agent** (`agents/activity-importer/`, run with `npm run agent:import`) built on the Claude Agent SDK. It is configured by an **agent spec** (a markdown file with front matter) and a folder of **skills** (`SKILL.md` files), both supplied by us per source.
- The agent takes a **file** (PDF, `.xlsx`, `.csv`, `.docx`, text) or a **URL** (one page or a bounded crawl of one site), extracts the activities it finds, classifies each one against our taxonomies using the skills, and produces records in the **ingest format** of `bulk-activity-ingest`.
- Default mode is **dry run**: records are written to a local JSON file for inspection. With `--submit` the agent posts them to `POST /api/ingest/activities` using a service token. It never writes to the database directly.
- Treat **all source content as untrusted data**: it is quoted to the model as data, never as instructions, and the agent's tools are restricted (read the given file, fetch only allowlisted hosts, no shell, no arbitrary file access, no access to secrets beyond the ingest token).
- Fetch URLs safely: https only, host allowlist from the spec, no private/loopback/link-local addresses (SSRF), redirect limits, size and time limits, robots.txt respected, polite rate.
- Make runs **repeatable and incremental**: record the source, content hash and result of each run; skip unchanged sources; rely on server-side duplicate detection for repeats.
- Provide **run reports**: counts of activities found, submitted, skipped, and items the agent was unsure about (with the reason), plus token/cost usage and a hard budget cap.
- Support running **from time to time**: manual CLI first, then an optional scheduled GitHub workflow that runs a named spec against its source list.
- Ship one **example spec** and wire the three existing skills into it as the first real run.

## Capabilities

### New Capabilities
- `activity-import-agent`: the agent runner, the spec and skills contract, source reading rules, safety restrictions, run reporting and scheduling.

### Modified Capabilities
- (none)

## Impact

- New: `agents/activity-importer/` (runner, tool wrappers, spec loader, source readers), `agents/specs/` and `agents/skills/` for versioned specs and skills, `.github/workflows/agent-import.yml` (optional schedule), `docs/agents.md`.
- Dependencies: the Claude Agent SDK, plus parsers for PDF/docx if not already present (`xlsx` already is). Dev/ops tooling, not part of the web bundle.
- Secrets: `ANTHROPIC_API_KEY` and an ingest service token, held in the operator's environment or the CI secret store, never in the repo or the app runtime.
- Hard dependency on `bulk-activity-ingest` for `--submit`. Dry run works without it.
- Security: the agent is a prompt-injection target by design (it reads third-party content), so its restrictions are specified and tested here; `security-testing` covers the ingest endpoint on the receiving side.
- Cost: every run costs model usage; runs have a budget cap and a dry-run default.
- Copyright: the agent records `source_url` and source label; whether a given source may be copied is a human decision, captured in the spec's `permission` field and shown in the admin review.

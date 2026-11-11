## Context

Skills already exist outside the repo (`atividades-classificar`: format, focus, division, place, duration, objectives, challenges; `atividades-riscos-qualidade`: risks, mitigation, SDGs, checklist; `atividades-escutismo`: orchestration for loading new sources into the `atividades_v2` sheet). They were written for an interactive assistant working into a Google Sheet. The catalogue itself is in PostgreSQL; the planned `bulk-activity-ingest` endpoint is the safe way in. The Excel import defines the accepted values (enum keys or Portuguese labels, goal codes, SDG numbers). Content is plain Portuguese text and must not be translated or rewritten beyond what a spec says.

## Goals / Non-Goals

**Goals:**
- A new source is onboarded by writing a spec and, if needed, a skill, with no code change.
- Output is always reviewable before it reaches the public catalogue.
- Safe against hostile or sloppy source content.

**Non-Goals:**
- Generating images (`activity-illustration-agent`).
- A web UI for running agents. CLI and CI only.
- Writing to the database or bypassing ingest validation.
- Deciding copyright permission. The agent records provenance; humans decide.

## Decisions

### Where it runs
A Node/TypeScript CLI in `agents/activity-importer/`, run by the maintainer or a CI workflow. It is not part of the Next.js app or its container, so the web app gains no model dependency and no new attack surface. Chosen over an in-app admin button because runs are long, cost money, and need an API key we do not want in the web runtime.

### Agent spec format
One markdown file per source family, with YAML front matter:

```
---
name: <kebab-case>
sources:            # files and/or URLs this spec may read
  - url: https://example.org/atividades
    crawl: { maxPages: 30, sameHostOnly: true }
allowHosts: [example.org]
skills: [atividades-classificar, atividades-riscos-qualidade]
defaults: { faixa_etaria: null, source_label: "Example" }
permission: "ok-to-copy" | "link-only" | "unknown"
budget: { maxUsd: 5, maxActivities: 200 }
---
<free-text instructions: what the source looks like, what to skip, special rules>
```

The loader validates it with Zod and refuses unknown keys. Specs live in `agents/specs/` and are versioned.

### Skills
`agents/skills/<name>/SKILL.md`, loaded by the SDK. The three existing skills are copied in as a starting point and adapted: sheet-writing steps are replaced by "emit an ingest record". Keeping them as plain files means they can be edited and reviewed like code.

### Pipeline
1. **Read**: a source reader returns plain text plus structure hints (page numbers, table rows, headings). PDF and docx are converted to text; spreadsheets become rows; URLs are fetched by the safe fetcher.
2. **Extract**: the model splits the text into candidate activities, quoting the source passage for each.
3. **Classify**: the model applies the skills to fill every ingest field and lists a `confidence` and `notes` per field it had to infer.
4. **Validate locally**: output is checked with the same Zod envelope schema the server uses (shared package/type in `src/lib/ingest`), so format errors are caught before submit.
5. **Emit**: write `runs/<timestamp>-<spec>.json` and a human summary; with `--submit`, POST in batches of at most 50.

Structured output is requested through a JSON schema tool rather than parsed from prose.

### Prompt-injection and tool restrictions
Source text is untrusted. It is passed inside clearly delimited data blocks with a system rule that nothing inside may change behaviour. The agent has only these tools: `read_source` (the specific files/URLs in the spec), `fetch_url` (allowlisted hosts, safe fetcher), `emit_records` (writes the output file). No shell, no filesystem beyond the run folder, no network except through `fetch_url` and the final ingest POST made by the runner, not the model. The ingest token is held by the runner and never placed in the model context. Even if injection succeeds, the worst outcome is bad *content* in an unapproved review queue.

### Safe fetcher
https only; resolve DNS and reject private, loopback, link-local and metadata addresses (including after redirects); at most 5 redirects; 10 s timeout; 5 MB body cap; content-type allowlist; `robots.txt` honoured; one request per second per host; custom `User-Agent` naming the Kit and a contact address.

### Incremental runs
A small `agents/state/<spec>.json` (gitignored locally; stored as a CI cache/artifact for scheduled runs) keeps, per source, the content hash and last run result. Unchanged sources are skipped. Changed sources are reprocessed fully; the server's duplicate detection prevents repeats from becoming activities.

### Budget and reporting
The runner tracks token usage and estimated cost, stops at `budget.maxUsd` or `maxActivities`, and always writes the report with what it finished. The report lists found, submitted, skipped-unchanged, low-confidence items and errors.

### Scheduling
Phase 1: manual `npm run agent:import -- --spec agents/specs/<name>.md [--file path | --url u] [--submit]`. Phase 2: `agent-import.yml` with `workflow_dispatch` and an optional cron, running a named spec with secrets from the CI store and uploading the report as an artifact. Scheduled runs always submit to ingest (unapproved), never to the catalogue.

### Model choice
Defaults to a current Sonnet-class model for extraction and classification; the spec may override. Chosen for cost over the largest model; escalation is a spec setting.

## Risks / Trade-offs

- **Prompt injection from a source** → untrusted-data framing, minimal tools, token outside model context, unapproved output.
- **Hallucinated or wrongly classified fields** → required source quote per activity, per-field confidence, admin review before approval, taxonomy values validated server-side.
- **Cost surprises** → dry-run default, budget cap, per-run cost in the report.
- **Copyright or terms-of-use problems** → `permission` field carried into `source` metadata and shown in the review screen; `unknown` and `link-only` default to a banner warning.
- **Skill drift from the originals** → skills are copied and owned in the repo; note the origin in each file.
- **Weak PDF extraction (scans, columns)** → low-quality sources are reported as such; OCR is out of scope for the first version.

## Migration Plan

Build dry-run first and compare output with a hand-made sample. Enable `--submit` once `bulk-activity-ingest` is live and a service token exists. Add the scheduled workflow only after two clean manual runs.

## Open Questions

- Which source is the first real target, and does it permit copying? This chooses the example spec.
- Where do scheduled runs keep state: CI cache, artifact, or a small table in the database?
- Should the agent also propose new taxonomy entries as notes in the report (never applied automatically)? Proposed: yes, report only.

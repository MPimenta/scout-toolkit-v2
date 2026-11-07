## Why

The catalogue has about 95 hand-drawn-style illustrations (an SVG and PNG per activity in `public/activity-illustrations/`, with a ten-image pilot folder) that give it a consistent look. The generator behind them is not in the repository, and the images are static files shipped with the build. Every new activity, whether proposed by a leader, imported in bulk or created by an admin, arrives without a picture and the style would drift if drawn by different people or tools. We want an agent that reproduces the house style on demand for any activity that has no image, and a storage path that works for activities created after deployment.

## What Changes

- Capture the **house style** as a versioned artefact: a style guide skill (`agents/skills/illustration-style/SKILL.md`) derived from the existing illustrations, with exemplar SVGs and a short list of rules (canvas, line colour, stroke, figure construction, hand-drawn displacement filter, palette limits, composition, what never to draw).
- Add an **illustration agent** (`agents/illustrator/`, `npm run agent:illustrate`) that finds activities without an image, reads each activity's name, description and materials, and produces an **SVG** in the house style with a Portuguese `aria-label`, then renders a **PNG** from it.
- Add **automatic checks** before anything is saved: SVG allowlist (no scripts, external references or event handlers), size and canvas limits, palette check, non-blank render check, and a model-side style check against the exemplars. Failed drawings are retried a bounded number of times, then reported.
- **Store and link** results where a running Azure container can reach them: upload SVG/PNG to the app's image store and set the activity's `image_url`, instead of writing into `public/` (which only changes with a new build).
- Add a **review step**: generated images are attached as a proposal an admin can accept, regenerate with a note ("less cluttered", "show a campfire") or replace by an uploaded image. Images for unapproved ingested activities are generated but only become visible with the activity.
- Support three triggers: single activity (`--activity <id>`), all missing (`--missing`), and a post-ingest hook an admin can run from the batches screen.
- Keep the existing 95 images untouched; add a **backfill check** that lists activities whose `image_url` points to a missing file.

## Capabilities

### New Capabilities
- `activity-illustrations`: house-style definition, generation, validation, storage and review of activity illustrations.

### Modified Capabilities
- `admin-activities`: admins can see, accept, regenerate or replace the generated illustration for an activity.

## Impact

- New: `agents/illustrator/`, `agents/skills/illustration-style/` with exemplars, `docs/illustration-style.md`, a table for illustration proposals (committed migration; ask before applying), an admin API and a small UI block on the activity edit screen.
- Reuses: Playwright Chromium (already a dependency for PDF export) to rasterise SVG to PNG; UploadThing's server API for storage (Azure Blob is a possible later swap, tracked in `migrate-hosting-to-azure`).
- Secrets: `ANTHROPIC_API_KEY` for the agent; UploadThing secret for storage; neither in the web bundle. Runs from the maintainer's machine or CI, not from the web request path.
- Security: SVG is active content. The sanitiser and a CSP-safe serving path are required, and `security-testing` includes an unsafe-SVG case.
- Cost: one or a few model calls per image; a per-run budget cap applies, as in `activity-import-agent`.
- Depends on `bulk-activity-ingest` only for the optional post-ingest hook. It works standalone for any activity with an empty `image_url`.
- Unchanged: existing images, catalogue layout, brand colours (the style palette is a drawing palette defined in the style guide, not a new brand colour).

## 1. Style definition

- [ ] 1.1 Analyse the existing set and `pilot/` and write `agents/skills/illustration-style/SKILL.md` and `docs/illustration-style.md` (canvas, stroke, palette, figure recipe, filter, composition, never-draw list) with 6–10 chosen exemplars — verify the maintainer approves the guide against a printed contact sheet
- [ ] 1.2 Extract the SVG skeleton (canvas, `hand` filter, group transform) into a shared template and add a script that lists the colours used across all existing SVGs — verify the palette in the guide matches the script output

## 2. Generation and validation

- [ ] 2.1 Create `agents/illustrator/` with CLI flags `--activity --missing --dry-run --budget` and `npm run agent:illustrate` — verify `--help` and that `--dry-run` writes only to a local folder
- [ ] 2.2 Implement scene-brief then SVG drawing with the style skill, treating activity text as data — verify an injection string in a description does not change the style or content rules
- [ ] 2.3 Implement the SVG sanitiser (element/attribute allowlist, size, canvas, palette) — verify unit tests for script, `foreignObject`, `onload`, external `href`, `data:` URI, oversize, off-palette colour
- [ ] 2.4 Render PNG with Playwright Chromium and add the non-blank check — verify a blank SVG fails and a pilot SVG passes
- [ ] 2.5 Add the model style check and the three-attempt retry loop with `needs_human` outcome — verify a deliberately off-style drawing is rejected and retries stop at three
- [ ] 2.6 Generate a dry-run sample of 10 new activities and compare with the pilot set — verify the maintainer judges them consistent in style

## 3. Storage, proposals and review

- [ ] 3.1 Add `activity_illustration_proposals` to `drizzle/schema`, generate and review the migration before applying (ask first) — verify it applies on `scout_toolkit_test`
- [ ] 3.2 Add the storage function (UploadThing server API behind one interface) and proposal creation — verify an integration test stores a proposal and never writes under `public/`
- [ ] 3.3 Add admin API for accept, reject, request-regeneration with note, and replace; classify routes in `FEATURE_ROUTES` and the security matrix — verify 401/403/200 per role and that accept sets `image_url`
- [ ] 3.4 Add the illustration block to the admin activity edit screen with `pt.json`/`en.json` strings, desktop and phone — verify Playwright as admin accepts and regenerates
- [ ] 3.5 Render generated images as PNG `<img>` with stored alt text and serve any SVG with sandbox/nosniff headers — verify a unit/e2e check that no generated SVG is inlined

## 4. Operations

- [ ] 4.1 Implement fulfilment of pending regeneration requests and `--missing` backfill ordering with the budget cap and run report — verify a small-budget run stops and reports correctly
- [ ] 4.2 Add a check listing activities whose `image_url` points to a missing static file — verify it flags a planted broken path
- [ ] 4.3 Document running the agent, the review flow and how to update the style guide in `docs/agents.md` — verify a fresh checkout can follow it to a dry run

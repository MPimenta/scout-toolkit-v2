## Context

`public/activity-illustrations/` holds a `<slug>.svg` and `<slug>.png` pair per activity (195 files) and a `pilot/` folder with ten newer SVGs and an `index.html` contact sheet. A sampled SVG shows the recipe: 1200×900 canvas, white background, a `feTurbulence` + `feDisplacementMap` filter (`id="hand"`) for a wobbly hand-drawn line, a group scaled and translated to fit, stick-figure people drawn as ellipse heads and polyline limbs, strokes of `#0b3a4a` at width 3–4 with round caps and joins, a faint ground line at 35 % opacity, and a Portuguese `role="img"` + `aria-label` describing the scene. The generator that produced them is not in the repository, so the style lives only in the outputs. The app has `image_url` on activities, UploadThing for uploads, Playwright Chromium for PDF, and no code that references the static folder, so linking is by `image_url` data.

The deployment target (Azure App Service container) serves only what was built into the image, so images for activities created later must live in external storage.

## Goals / Non-Goals

**Goals:**
- New illustrations are indistinguishable in style from the existing set.
- Generation is repeatable, bounded in cost and safe to serve.
- A human can always accept, redo or replace the result.

**Non-Goals:**
- Photographs, realistic people, logos or copyrighted characters.
- Redrawing or restyling the existing 95 images.
- A general image-generation feature for users. This is an admin and operator tool.
- Choosing a new brand palette.

## Decisions

### SVG as the primary artefact, PNG derived
The model writes SVG directly, as the existing set is vector line art. PNG (1200×900) is rendered with Playwright Chromium from the validated SVG, for places that need a raster (cards, PDF). This avoids a separate raster image model and keeps results editable and tiny. A raster text-to-image model would not hold the style or the Portuguese alt text reliably.

### The style guide is a skill with exemplars
`agents/skills/illustration-style/SKILL.md` states the rules in plain Portuguese-and-English prose plus a minimal SVG skeleton (canvas, filter definition, group transform) that every output must start from, and links 6 to 10 exemplar SVGs from the existing set that cover people, objects, outdoor and indoor scenes. `docs/illustration-style.md` is the human-readable copy. When the style changes, the skill changes; no code does.

### Prompt = skill + activity text, and a scene brief first
Step 1 asks the model for a short scene brief (who, what object, what action, setting, max five elements) from the activity text. Step 2 draws the SVG from the brief and the skeleton. Two steps keep compositions simple and make "regenerate with a note" possible by editing the brief. Activity text is untrusted data (it may come from an import), framed as data only.

### Validation gates (all must pass)
1. **Sanitiser**: parse with an XML parser; allowlist of elements (`svg, defs, filter, feTurbulence, feDisplacementMap, g, path, ellipse, circle, rect, line, polyline, polygon, text` only if the style permits) and attributes; reject `script`, `foreignObject`, `use` with external `href`, `style` with `url(`, any `on*` attribute, any `href` to a non-fragment, any `data:`.
2. **Limits**: file under 150 KB, canvas `viewBox="0 0 1200 900"`, at most N elements.
3. **Palette**: colours restricted to the style palette in the guide (line `#0b3a4a`, white, and the small accent set found in exemplars).
4. **Render check**: PNG is not blank (non-white pixel ratio within a range).
5. **Style check**: a second model call compares the render with two exemplars and answers pass/fail with a reason. Used as a filter, not as proof.
Up to 3 attempts, feeding the failure reason back; then the activity is reported as `needs-human`.

### Storage and linking
Validated SVG and PNG are uploaded through the UploadThing server API and the PNG URL is written to `image_url` only on accept (or immediately for activities not yet approved, since an admin reviews the whole activity). SVG is stored alongside as `image_svg_url` in the proposal row, not served inline. Existing static images keep their relative `image_url`. Azure Blob can replace UploadThing later without changing the agent, because storage sits behind one function.

### Proposal table
`activity_illustration_proposals`: id, activity_id, svg_url, png_url, scene_brief, attempt count, status (`proposed | accepted | rejected | needs_human`), note, created_by (operator/agent), timestamps. Accept copies `png_url` into `activities.image_url`. Regenerate creates a new proposal from the same brief plus the admin's note.

### Triggers
- CLI: `--activity <id>`, `--missing` (all activities with empty `image_url`, newest first, capped by budget), `--dry-run` (writes files to a local folder only).
- Admin: a "Gerar ilustração" button on the activity edit screen that records a request; the operator CLI (or a scheduled workflow) fulfils it. Generation is never done inside a web request, so the web app needs no model key and no browser runtime beyond what PDF already has.

### Serving safety
Pages reference the PNG in `<img>`. SVG is never inlined into pages and never served from the app's origin with an executable content type. If SVG must be served, it carries `Content-Security-Policy: sandbox; default-src 'none'` and `X-Content-Type-Options: nosniff`.

### Accessibility
The SVG's `aria-label` (Portuguese) is stored as the image's alt text when the card renders it; the agent writes it from the scene brief, one sentence, no names of children.

### Content rules
No faces beyond the simple style, no real people or named minors, no logos or brand marks other than the Escoteiros symbols already used in exemplars if the style guide allows them, no text inside the drawing except short labels in Portuguese.

## Risks / Trade-offs

- **Model-drawn SVG may look amateur or off-style** → exemplars in the prompt, style check, human accept step, bounded retries, ability to upload a replacement.
- **SVG is an XSS vector** → sanitiser allowlist, never inlined, sandbox headers, covered by security tests.
- **Style drift over time** → exemplar set and guide are versioned; the guide records the version used in each proposal.
- **Cost growth on large backfills** → budget cap, newest-first ordering, `--dry-run`.
- **The original generator is missing, so the "style" is inferred** → first task is to extract and agree the rules with the maintainer on a sample sheet before building the agent.
- **UploadThing as long-term storage couples us to a vendor** → storage hidden behind one function; Blob migration noted.

## Migration Plan

1. Agree the style guide on a contact sheet of generated samples against the pilot set.
2. Ship the CLI in dry-run only. 3. Add the proposal table and admin accept flow. 4. Run `--missing` for activities without images, review, accept. No change to existing images or routes.

## Open Questions

- Is the pilot folder the *target* style (newer than the 95 in the main folder)? If so exemplars should come from `pilot/`.
- Is UploadThing acceptable for generated images, or should they wait for Azure Blob?
- Should accepted images also be committed back to `public/activity-illustrations/` for the catalogue's static set, or stay external only?
- Which accent colours, if any, beyond the line colour are allowed by the brand handoff?

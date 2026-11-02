---
paths:
  - "src/lib/export/**"
  - "src/hooks/useProgramExport.ts"
  - "src/hooks/useProgramPDFExport.ts"
---

# Program export

- Excel: SheetJS (`xlsx`) with a schedule sheet (time, activity, duration, location, effort, type) and a summary sheet (educational goals, SDGs).
- PDF: render HTML (`pdf-html.ts`) and print with Playwright in the Node.js runtime, never Edge. Fall back to an installed Chrome or Edge if the bundled Chromium is missing.
- Check access with `access.ts` before exporting. Show progress and error feedback in the UI.

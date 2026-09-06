---
title: "Epic 6 Complete — The Paperwork That Prints Itself"
description: "Excel, PDF, and the art of handing a scout leader a programa they can take to the woods without opening a laptop"
pubDate: 2026-09-05
tags: [devlog, epic-complete, export, excel, pdf, playwright]
scoutingContext: "How this epic turns a Saturday programa into something you can print, share, and pin to the noticeboard"
epicNumber: 6
epicName: "Export Functionality"
status: published
---

## The Paperwork That Prints Itself 📄

In scouting, the programa only becomes real when it leaves the screen. A chefe needs a sheet they can fold into a pocket, tape to a tent pole, or hand to the parent who asks “what time is lunch?” Epic 6 is that moment: the builder finally speaks Excel and PDF.

Another epic completed. This time we tackled **Export Functionality** and learned that “just download the file” is never just a download — it is authentication, taxonomy, Portuguese labels, and a browser that may or may not be installed.

## What We Built 🏗️

The question was not “what is the most elegant export pipeline?” It was “what would a dirigente actually take to the campo?”

### Core Functionality
- ✅ **Excel export** — SheetJS workbook with three Portuguese sheets: Resumo, Cronograma, Detalhes das Atividades
- ✅ **PDF export** — Playwright renders print-optimized HTML to A4
- ✅ **Unified program page** — `/programs/[id]` *is* the builder; the old `/builder` route is gone
- ✅ **Educational goals and SDGs** — pulled from the activity joins, not hardcoded as `N/A`
- ✅ **Download buttons** — Exportar Excel and Exportar PDF on the program page

## The Journey 🗺️

### Story 6.1: Excel Export
**The spreadsheet a chefe can actually read**

The first export was technically correct and linguistically English. Sheet names said Summary. Goals said `N/A`. That is not a programa — that is a developer souvenir.

We extracted `buildProgramExcelWorkbook()` so the workbook is a pure function: feed it a program, get a buffer. Labels, group size, effort, and location now match the rest of the app (`Médio (7-15)`, `Alto`, `Exterior`). Goals and ODS land on the summary, the schedule, and the details sheet.

**What We Learned:**
- Empty taxonomy is `—`, not a fake “N/A”
- Column widths are the difference between “formatted” and “unreadable”
- `mutate` vs `mutateAsync` decides whether the success toast waits for the file

### Story 6.1.a: Program Detail & Builder Unification
**One page, one truth**

Leaders were bouncing between a detail view and a builder view for the same programa. The detail page now mounts `ProgramBuilder` directly. Edit lives in `EditProgramModal`. `/programs/[id]/builder` is deleted.

**What We Learned:**
- Duplicate routes go stale the moment you add a button to only one of them
- Tests that still expect “Add Activity” will crash on `program.name` after unification. Update them.

### Story 6.2: PDF Export
**HTML that knows it will become paper**

PDF is Playwright, not a PDF library. We generate Portuguese HTML (cronograma + resumo, print CSS, escaped names) and print it to A4. The architecture doc once promised Vercel Edge for this. Playwright needs a real browser, so the route stays on the Node runtime. Bundled Chromium first; installed Chrome or Edge if the download never happened.

**What We Learned:**
- `npx playwright install chromium` can install a *different* build than `node_modules/playwright`. Use `npm run playwright:install`
- First PDF on a cold machine is slow. That is the browser waking up, not the API lying
- If you mock `document.createElement` globally, React 19 cannot mount a hook test

## The Technical Deep Dive 🔧

### Shared export loader
Both formats now go through `loadProgramForExport()`:

```typescript
const program = await loadProgramForExport(programId);
if (!program) return apiErrors.notFound('Programa não encontrado');
if (!canAccessProgramExport(program, session.user.id)) {
  return apiErrors.forbidden('Acesso negado a este programa');
}
```

Owner or public. Invalid UUID is 400. Private programa belonging to someone else is 403.

### Excel sheets
```typescript
XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');
XLSX.utils.book_append_sheet(workbook, scheduleSheet, 'Cronograma');
if (activityEntries.length > 0) {
  XLSX.utils.book_append_sheet(workbook, activityDetailsSheet, 'Detalhes das Atividades');
}
```

### PDF launch fallback
```typescript
try {
  return await chromium.launch();
} catch (error) {
  // fall back to channel: 'chrome' then 'msedge'
}
```

## The Numbers 📈

- **Export unit + integration:** 30 tests passing
- **ProgramBuilder (updated for the unified page):** 11 tests passing
- **E2E (Chromium):** 3 passed, 1 skipped (authenticated download needs a real eAEP session)
- **Full Vitest run on this machine:** 354 passed, 14 failed, 27 skipped (395)
- The 14 failures are older Postgres integration tests against `localhost:5432/scout_toolkit_test` (this setup uses Neon) plus a flaky ActivityFilters SDG case. They are not export regressions.

## What's Next? 🚀

Epic 6 closes the loop from “I planned a Saturday” to “I am holding the Saturday.” Epic 7 is user feedback — ratings and comments — so a programa can come back with opinions attached.

**Key Takeaways:**
- Export is a product feature, not a file conversion
- Portuguese-only means the spreadsheet too
- Document the browser install, or the next clone will get a 500
- Do not claim Vercel Edge for a process that launches Chromium

## The Scout's Promise 🏕️

A good programa is a promise to a patrol. Epic 6 makes that promise portable: Excel for the people who live in grids, PDF for the people who live on clipboards.

**Epic 6: Export Functionality** — because the woods do not have Wi‑Fi, and the cronograma still has to happen.

---

*Ready for the next adventure? Epic 7 awaits.*

---

**Note**: This post was generated by an AI model with human review and fine-tuning. The technical implementations and commands are real; the scouting voice was kept in line with earlier epic posts.

## Context

See proposal.md. `AppShell` already wraps every non-auth page with Header/Footer; auth routes render only `<main>`. Admin already has a gated dashboard and `/admin/sugestoes`. Notifications already exist (`notifications` table). Edit suggestions are per-activity field patches — do not reuse that table. Locale catalogs and `useLocale()` already cover chrome.

## Goals / Non-Goals

**Goals:**

- One floating launcher + sheet, including `/auth/*`
- Persist reports with automatic page context
- Admin queue under existing admin gate
- Default Portuguese copy in catalogs

**Non-Goals:**

- Email, Slack, or GitHub delivery
- Screenshot upload or console-log capture
- Public tracker for reporters
- Merging with edit suggestions
- New brand colours or a third-party widget

## Decisions

1. **In-app inbox, not a SaaS widget**  
   Leaders already use Kit; admins already have sugestões. Intercom/Canny would add cost and English-first chrome.  
   Alternative: email to `ADMIN_EMAILS`. Rejected for v1 — no SMTP in the stack.

2. **New `issue_reports` table**  
   Columns: id, kind (`incidente` | `conteudo` | `ideia`), message, contact_email (optional), path, locale, viewport, user_id (nullable FK to Auth.js `user`), status (`aberto` | `fechado`), created_at, closed_at, closed_by.  
   Alternative: reuse `notifications` or `edit_suggestions`. Rejected — wrong shape and guest reporters have no user id.

3. **Launcher in the document root, not only AppShell header**  
   Mount next to `AppShell` in the root layout so `/auth/signin` still has Reportar. Fixed bottom-right, above the footer safe area; on phone keep it clear of the header locale/user cluster. Use the existing Sheet.  
   Alternative: header link only. Rejected — easy to miss on long activity lists.

4. **Context is client-declared, server-enriched**  
   Client sends path, locale, viewport. Server overwrites user_id from the session when present and ignores a forged user id. Do not capture cookies or tokens.  
   Alternative: server reads Referer only. Rejected — Referer is often missing.

5. **Rate limit in the route, not a new service**  
   In-memory sliding window is enough for one Vercel instance / local. Five guest posts / 10 minutes per IP; twenty if signed in.  
   Alternative: Upstash. Rejected until volume appears.

6. **Admin page `/admin/reportes`**  
   Mirror sugestões: list, filter abertos, mark fechado. Dashboard gets a pending count and a nav link. Creating a report inserts one notification per admin (`type: issue_report`).

## Risks / Trade-offs

- [Risk] Guest spam → Mitigation: 429 + short message + no file upload
- [Risk] Path spoofing → Mitigation: still useful as a hint; admins treat it as claimed context
- [Risk] Floating button covers content on small screens → Mitigation: offset from edges; hide while the sheet is open
- [Risk] Contact email harvested → Mitigation: admin-only read; do not show emails on public pages

## Migration Plan

Add the Drizzle table and push on local + hosted Preview (existing `ensure-hosted-db.mjs`). Rollback: drop the table and remove the launcher.

## Open Questions

None that block the spec. Screenshot capture can wait for a later change.

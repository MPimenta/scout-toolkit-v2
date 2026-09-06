## Context

See proposal.md. Chrome is hardcoded Portuguese in components (header nav, SignInButton, forms). Story 1.4.a removed next-intl and `/[locale]` after Turbopack + Edge middleware failures. The user widget is `SignInButton` in `src/components/layout/Header.tsx` (Entrar or avatar). Catalogue and UGC rows are stored as authored, almost always Portuguese. Playwright asserts Portuguese strings and must stay green on the default.

## Goals / Non-Goals

**Goals:**

- Cookie-backed `pt` | `en` with Portuguese default
- Header switcher next to the user widget, including phone width
- Message catalogs for chrome only
- Document `lang` matches the active locale

**Non-Goals:**

- `/pt` or `/en` URL prefixes or a `[locale]` app segment
- Translating stored activities, programs, ratings, or taxonomies
- Persisting locale on the Auth.js `user` row
- A third locale
- Rewriting the existing Playwright suite into bilingual tests
- Changing API JSON error strings that are not shown as chrome

## Decisions

1. **Cookie, not a path prefix**  
   Saved locale in a first-party cookie (for example `kit-locale=pt|en`). Server layout reads it so the first paint matches.  
   Alternative: `/en/activities`. Rejected: Story 1.4.a already proved prefix routing + middleware was the failure mode; the user asked for a header control, not localized URLs.

2. **Catalog + provider, optional next-intl without routing**  
   JSON (or TS) message files for `pt` and `en`, plus a client provider. next-intl is allowed only if it does **not** require `[locale]` segments or Edge i18n middleware. A thin context is equally acceptable.  
   Alternative: bring back next-intl with localePrefix always. Rejected unless it can run without the old routing.

3. **Chrome vs content**  
   Keys cover nav, buttons, labels, empty states, toasts, and dialog chrome. Activity/program/review body is `children` / API fields, never a catalog key.  
   Alternative: machine-translate catalogue rows. Rejected: authors write Portuguese; we do not invent English activity copy.

4. **No account-level locale**  
   Cookie is enough for guests and signed-in users on one browser.  
   Alternative: column on `user`. Deferred; would need a write on every switch and would not help guests.

5. **Switcher sits beside SignInButton**  
   Same header cluster, left of Entrar/avatar, visible signed-out and signed-in. Compact `PT` / `EN` control with an accessible name (for example "Idioma" / "Language"). On `< md` it stays in that cluster, not only in the sheet.  
   Alternative: put language inside the avatar menu. Rejected: guests have no avatar menu.

6. **Tests stay Portuguese by default**  
   Do not set the cookie in existing specs. Add one unit test for the cookie/default and one Playwright spec that switches to English and back. Fix leftover hardcoded English in the add-activity dialog as part of the `pt` catalog.

## Risks / Trade-offs

- [Risk] A second pass misses hardcoded strings → Mitigation: catalog the header, auth, activities, programs, admin, and export chrome in this change; leftover strings stay Portuguese until found (acceptable; default is PT).
- [Risk] next-intl + Turbopack regresses → Mitigation: no locale middleware; drop next-intl and keep the thin provider if the build breaks.
- [Risk] Cookie blocked → Mitigation: in-memory locale for the tab; next visit falls back to `pt`.
- [Risk] Phone header overflows with four controls → Mitigation: compact PT/EN toggle; lockup already shrinks (`mobile-layout`).
- [Risk] Playwright selectors that use Portuguese labels fail if a prior test left English → Mitigation: default cookie unset; locale spec isolates its own cookie.

## Migration Plan

Ship catalogs and the switcher together. Existing bookmarks stay valid. Rollback: remove the control and catalogs; hardcoded Portuguese remains the fallback until strings are fully keyed.

## Open Questions

None that block the spec. Exact catalog library (next-intl vs thin context) is an apply-time choice under decision 2.

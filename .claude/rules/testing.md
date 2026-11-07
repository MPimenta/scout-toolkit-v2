---
paths:
  - "tests/**"
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
  - "vitest.config.mts"
  - "playwright.config.ts"
---

# Testing

- Layout: `tests/unit/` (components, lib, hooks, api, …), `tests/integration/` (api, auth, db, types), `tests/e2e/` (by feature), shared helpers in `tests/helpers/`.
- Naming: `Name.test.tsx` / `fn.test.ts` for unit, `name.integration.test.ts` for integration, `flow.spec.ts` for E2E.
- All integration tests share one `scout_toolkit_test` DB, and parallel files truncate each other. Use the helpers in `tests/helpers/` (`bound-test-db.ts`, `local-test-db.ts`) and keep tests isolated.
- Wrap React state updates in `act()` and mock external services (Orgo, Azure Blob).
- Cover both success and error cases. Target 80%+ coverage for new code.

/** Database used only by Playwright runs. CI overrides it with E2E_DATABASE_URL. */
export const E2E_DATABASE_URL =
  process.env['E2E_DATABASE_URL'] ??
  'postgresql://postgres:password@localhost:5432/scout_toolkit_e2e';

/** Dedicated ports so Playwright never reuses a developer's `npm run dev` on :3000. */
export const E2E_PORT = 3200;

/** Second server for the `mvp` project: FEATURES unset, so every non-MVP feature is off. */
export const E2E_MVP_PORT = 3201;

/** Third server for the `pwa` project: a production build with FEATURES=pwa (service workers need one). */
export const E2E_PWA_PORT = 3202;

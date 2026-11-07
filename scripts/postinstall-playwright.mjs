// Installs this project's Playwright Chromium after `npm install` so PDF export
// and e2e tests work without a manual step. Skipped in CI and on Vercel (both
// set CI), or when PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD is set. Playwright skips the
// download itself when the browser is already present.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (process.env.CI || process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD) {
  process.exit(0);
}

const cli = 'node_modules/playwright/cli.js';
if (!existsSync(cli)) {
  // Production-only install without devDependencies: nothing to do.
  process.exit(0);
}

const result = spawnSync(process.execPath, [cli, 'install', 'chromium'], { stdio: 'inherit' });
if (result.status !== 0) {
  console.warn('Playwright Chromium install failed; run `npm run playwright:install` later.');
}
process.exit(0);

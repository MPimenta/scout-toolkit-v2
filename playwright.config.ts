import { defineConfig, devices } from '@playwright/test';
import { E2E_DATABASE_URL, E2E_MVP_PORT, E2E_PORT, E2E_PWA_PORT } from './tests/e2e/e2e-env';

const fullURL = `http://localhost:${E2E_PORT}`;
const mvpURL = `http://localhost:${E2E_MVP_PORT}`;
const pwaURL = `http://localhost:${E2E_PWA_PORT}`;

/**
 * Env for the e2e web servers. They write only to scout_toolkit_e2e, enable the
 * test-only login, and blank the Orgo write token so the Orgo flow uses its stub.
 */
const baseServerEnv = {
  DATABASE_URL: E2E_DATABASE_URL,
  E2E_LOGIN: '1',
  ORGO_API_TOKEN: '',
};

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  // The dev server compiles routes on first request, so cold pages need more than the 5 s default.
  expect: { timeout: 15_000 },
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : 4,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: fullURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Everything on, like FEATURES=all: the full regression suite.
    {
      name: 'chromium',
      testIgnore: ['**/mvp/**', '**/pwa/**'],
      use: { ...devices['Desktop Chrome'], baseURL: fullURL },
    },
    {
      name: 'Mobile Chrome',
      testIgnore: ['**/mvp/**', '**/pwa/**'],
      use: { ...devices['Pixel 5'], baseURL: fullURL },
    },
    // Installable app: a production build with FEATURES=pwa (service workers do not run under the
    // dev server). Slower, so it is its own project.
    {
      name: 'pwa',
      testMatch: '**/pwa/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: pwaURL },
    },
    // The MVP default: FEATURES unset, every non-MVP feature off.
    {
      name: 'mvp',
      testMatch: '**/mvp/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: mvpURL },
    },
  ],
  webServer: [
    {
      // Builds the app, then serves it: a production server, so the worker can register.
      command: `npx next build --turbopack && npx next start --port ${E2E_PWA_PORT}`,
      url: pwaURL,
      reuseExistingServer: !process.env['CI'],
      timeout: 600 * 1000,
      env: {
        ...baseServerEnv,
        NEXT_DIST_DIR: '.next-e2e-pwa',
        NEXTAUTH_URL: pwaURL,
        AUTH_URL: pwaURL,
        AUTH_TRUST_HOST: 'true',
        NEXT_PUBLIC_APP_URL: pwaURL,
        FEATURES: 'pwa',
      },
    },
    {
      command: `npm run dev -- --port ${E2E_PORT}`,
      url: fullURL,
      reuseExistingServer: !process.env['CI'],
      timeout: 180 * 1000,
      env: {
        ...baseServerEnv,
        NEXT_DIST_DIR: '.next-e2e',
        NEXTAUTH_URL: fullURL,
        AUTH_URL: fullURL,
        NEXT_PUBLIC_APP_URL: fullURL,
        FEATURES: 'all',
      },
    },
    {
      command: `npm run dev -- --port ${E2E_MVP_PORT}`,
      url: mvpURL,
      reuseExistingServer: !process.env['CI'],
      timeout: 180 * 1000,
      env: {
        ...baseServerEnv,
        NEXT_DIST_DIR: '.next-e2e-mvp',
        NEXTAUTH_URL: mvpURL,
        AUTH_URL: mvpURL,
        NEXT_PUBLIC_APP_URL: mvpURL,
        FEATURES: '',
      },
    },
  ],
});

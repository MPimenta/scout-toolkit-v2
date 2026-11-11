import { test, expect } from '@playwright/test';

/**
 * With FEATURES unset (the MVP default) the installable app is off: no manifest, no install
 * entry, no worker registered, and /sw.js is the worker that retires any earlier registration.
 */
test.describe('The installable app is off in the MVP', () => {
  test('the manifest answers 404 and no page links one', async ({ page, request }) => {
    expect((await request.get('/manifest.webmanifest')).status()).toBe(404);
    await page.goto('/home');
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(0);
    await expect(page.locator('meta[name="theme-color"]')).toHaveCount(0);
    await expect(page.locator('meta[name="viewport"]')).not.toHaveAttribute('content', /viewport-fit/);
  });

  test('/sw.js serves the self-unregistering worker, never the caching one', async ({ request }) => {
    const response = await request.get('/sw.js');
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toBe('no-cache');
    const source = await response.text();
    expect(source).toContain('switched off');
    expect(source).not.toContain("addEventListener('fetch'");
  });

  test('no worker is registered, and no install entry or display-mode marker shows', async ({ page }) => {
    await page.goto('/about');
    await page.waitForTimeout(1000);
    const registrations = await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length);
    expect(registrations).toBe(0);
    await expect(page.getByRole('button', { name: 'Instalar aplicação' })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.dataset.displayMode)).toBeUndefined();
  });

  test('the offline page stays reachable', async ({ request }) => {
    expect((await request.get('/offline')).status()).toBe(200);
  });
});

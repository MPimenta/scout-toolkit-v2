import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import { createDbSession, type DbSession } from '../helpers/db-session';

/**
 * The installable app, against a production build with FEATURES=pwa (openspec: mobile-pwa).
 * Service workers do not run under the dev server, so this project builds the app first.
 * Everything it checks is something a regression would break silently: the worker must never
 * keep private data, and a switched-on app must stay installable.
 */

/** Waits until the worker controls the page (registered, activated, claimed, then a reload). */
async function waitForWorker(page: Page) {
  await page.goto('/about');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
}

/** Every entry of every cache, as { cache, path }. */
async function cacheEntries(page: Page) {
  return page.evaluate(async () => {
    const out: Array<{ cache: string; path: string }> = [];
    for (const name of await caches.keys()) {
      for (const request of await (await caches.open(name)).keys()) {
        out.push({ cache: name, path: new URL(request.url).pathname });
      }
    }
    return out;
  });
}

test.describe('Manifest and installability', () => {
  test('serves a manifest with the fields an installable app needs', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/manifest+json');
    const manifest = await response.json();
    expect(manifest).toMatchObject({
      name: 'Kit de Atividades',
      display: 'standalone',
      lang: 'pt',
      scope: '/',
      start_url: '/home?source=pwa',
    });
    const icons = manifest.icons as Array<{ sizes: string; purpose: string }>;
    expect(icons.map((i) => `${i.sizes}:${i.purpose}`)).toEqual(['192x192:any', '512x512:any', '512x512:maskable']);
  });

  test('links the manifest and has the phone-app head', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest');
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /viewport-fit=cover/);
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).not.toMatch(/maximum-scale|user-scalable/); // zoom stays available
    await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2);
    await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes');
  });

  test('Chromium reports no installability errors', async ({ page, context }) => {
    await waitForWorker(page);
    const cdp = await context.newCDPSession(page);
    const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
    expect(installabilityErrors).toEqual([]);
  });

  test('serves the worker with no-cache and root scope', async ({ request }) => {
    const response = await request.get('/sw.js');
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toBe('no-cache');
    expect(response.headers()['service-worker-allowed']).toBe('/');
    expect(await response.text()).not.toContain('switched off');
  });
});

test.describe('Worker and offline page', () => {
  test('the worker registers and controls the page', async ({ page }) => {
    await waitForWorker(page);
    const scope = await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.scope);
    expect(scope).toMatch(/\/$/);
  });

  test('shows the Portuguese offline page when the network is cut, and retry returns to the page', async ({ page, context }) => {
    await waitForWorker(page);
    await context.setOffline(true);
    await page.goto('/activities').catch(() => undefined);
    await expect(page).toHaveURL(/\/offline\?from=%2Factivities$/);
    await expect(page.getByRole('heading', { name: 'Sem ligação' })).toBeVisible();
    await expect(page.getByText(/Entrar, os programas e as exportações precisam de ligação/)).toBeVisible();
    // No session-dependent chrome on the stored page.
    await expect(page.getByRole('button', { name: 'Abrir menu' })).toHaveCount(0);

    await context.setOffline(false);
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page).toHaveURL(/\/activities$/);
    await expect(page.getByRole('heading', { name: 'Atividades' })).toBeVisible();
  });
});

test.describe('Offline page accessibility', () => {
  // axe-core is injected into the page; WCAG 2.1 A and AA rules, as the project requires.
  async function violations(page: Page) {
    await page.addScriptTag({ path: require.resolve('axe-core') });
    return page.evaluate(async () => {
      const axe = (window as unknown as { axe: { run: (c: unknown, o: unknown) => Promise<{ violations: Array<{ id: string; help: string; nodes: unknown[] }> }> } }).axe;
      const result = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
      return result.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`);
    });
  }

  test('the offline page has no axe violations, in Portuguese and in English', async ({ page, context, baseURL }) => {
    await page.goto('/offline?from=%2Factivities');
    await expect(page.getByRole('heading', { name: 'Sem ligação' })).toBeVisible();
    expect(await violations(page)).toEqual([]);

    await context.addCookies([{ name: 'kit-locale', value: 'en', url: baseURL! }]);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'No connection' })).toBeVisible();
    expect(await violations(page)).toEqual([]);
  });
});

test.describe('Updates', () => {
  test('offers "Atualizar" for a new worker version, never reloads by itself, and applies it once accepted', async ({ page }) => {
    await waitForWorker(page);
    await page.evaluate(() => {
      (window as unknown as { __samePage: boolean }).__samePage = true;
    });

    // A new version: the same scope gets a worker from a different script URL. The browser installs
    // it as an update while the current one still controls the page, as after a deploy.
    await page.evaluate(() => navigator.serviceWorker.register('/sw.js?next-version', { scope: '/' }));

    await expect(page.getByText('Nova versão disponível')).toBeVisible();
    // Waiting, not applied: the page is untouched (an open admin form would keep its input).
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => (window as unknown as { __samePage?: boolean }).__samePage)).toBe(true);

    await page.getByRole('button', { name: 'Atualizar' }).click();
    // Accepting activates the new worker and reloads the page onto it.
    await expect
      .poll(async () => {
        try {
          return await page.evaluate(() => (window as unknown as { __samePage?: boolean }).__samePage);
        } catch {
          return 'navigating';
        }
      })
      .toBeUndefined();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  });
});

test.describe('Nothing private is cached', () => {
  let session: DbSession;

  test.beforeEach(async ({ context, baseURL }) => {
    session = await createDbSession();
    await context.addCookies([session.cookie(baseURL!)]);
  });

  test.afterEach(async () => {
    await session.cleanup();
  });

  async function browseSignedIn(page: Page) {
    await waitForWorker(page);
    await page.goto('/programs');
    await expect(page.getByRole('heading', { name: 'Meus Programas' })).toBeVisible();
    await page.goto('/activities');
    const firstActivity = page.locator('main a[href^="/activities/"]').first();
    await expect(firstActivity).toBeVisible();
    await firstActivity.click();
    await expect(page).toHaveURL(/\/activities\/[0-9a-f-]{36}$/);
    // Data requests the app makes while signed in.
    await page.evaluate(async () => {
      await fetch('/api/programs');
      await fetch('/api/activities?limit=3');
      await fetch('/api/auth/session');
    });
    await page.waitForTimeout(1000);
  }

  test('after a signed-in browse the caches hold no API response, auth request or page document', async ({ page }) => {
    await browseSignedIn(page);
    // Signed in for real: the menu shows the account, not "Entrar".
    await expect(page.getByRole('button', { name: session.name })).toBeVisible();

    const entries = await cacheEntries(page);
    expect(entries.length).toBeGreaterThan(0); // the worker did cache what is safe to cache
    const offending = entries.filter(
      (entry) =>
        entry.path.startsWith('/api/') ||
        entry.path.startsWith('/auth/') ||
        entry.path.startsWith('/media/') ||
        !(entry.path.startsWith('/_next/static/') || entry.path.startsWith('/brand/') || entry.path === '/offline')
    );
    expect(offending, `private or unexpected entries cached: ${JSON.stringify(offending)}`).toEqual([]);

    // The session cookie never ends up in a cache either.
    const bodies = await page.evaluate(async () => {
      const texts: string[] = [];
      for (const name of await caches.keys()) {
        for (const request of await (await caches.open(name)).keys()) {
          const response = await (await caches.open(name)).match(request);
          if (response && /text|json|javascript/.test(response.headers.get('content-type') ?? '')) {
            texts.push(await response.clone().text());
          }
        }
      }
      return texts;
    });
    expect(bodies.some((text) => text.includes('authjs.session-token'))).toBe(false);
  });

  test('signing out deletes the worker caches', async ({ page, context }: { page: Page; context: BrowserContext }) => {
    // Record every cache deletion; the binding survives the navigation that sign-out causes.
    const deleted: string[] = [];
    await context.exposeBinding('__cacheDeleted', (_source, name: string) => void deleted.push(name));
    await context.addInitScript(() => {
      const original = CacheStorage.prototype.delete;
      CacheStorage.prototype.delete = function (name: string) {
        (window as unknown as { __cacheDeleted: (n: string) => void }).__cacheDeleted(name);
        return original.call(this, name);
      };
    });

    await browseSignedIn(page);
    const before = await cacheEntries(page);
    expect(before.length).toBeGreaterThan(0);

    await page.getByRole('button', { name: session.name }).click();
    await page.getByRole('menuitem', { name: 'Sair' }).click();
    await expect(page.getByRole('button', { name: 'Entrar' }).first()).toBeVisible();

    expect(deleted.filter((name) => name.startsWith('kit-')).sort()).toEqual(['kit-pages-v1', 'kit-static-v1']);
    // The session is gone on the server too.
    const sessionResponse = await page.request.get('/api/auth/session');
    expect(await sessionResponse.json()).toBeNull();
  });
});

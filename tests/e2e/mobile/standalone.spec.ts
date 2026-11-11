import { test, expect, type Page } from '@playwright/test';
import { signInE2E, signOutE2E } from '../helpers/session';

/**
 * The installed app on a phone (openspec: mobile-pwa, section 4). The dev server runs with every
 * flag on, so the pwa flag is on. Standalone mode is emulated by answering the display-mode media
 * query, and a device inset by overriding the --safe-* variables the components read.
 */
test.describe('Installed app on a phone', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Runs once, on desktop Chromium at a phone viewport');
  });

  async function openAsInstalledApp(page: Page) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      const real = window.matchMedia.bind(window);
      window.matchMedia = ((query: string) =>
        query.includes('display-mode: standalone')
          ? ({
              matches: true,
              media: query,
              onchange: null,
              addEventListener: () => undefined,
              removeEventListener: () => undefined,
              addListener: () => undefined,
              removeListener: () => undefined,
              dispatchEvent: () => false,
            } as MediaQueryList)
          : real(query)) as typeof window.matchMedia;
    });
  }

  test('marks the document as standalone and keeps content off a notch and the home indicator', async ({ page }, testInfo) => {
    await openAsInstalledApp(page);
    await page.goto('/home');
    await expect(page.locator('html')).toHaveAttribute('data-display-mode', 'standalone');

    // Simulate a phone with a notch (top, sides) and a home indicator (bottom).
    await page.addStyleTag({
      content: ':root{--safe-top:44px;--safe-right:47px;--safe-bottom:34px;--safe-left:47px}',
    });

    // toHaveCSS retries: some of these elements animate (transition-all) after the override.
    await expect(page.locator('body')).toHaveCSS('padding-left', '47px');
    await expect(page.locator('body')).toHaveCSS('padding-right', '47px');
    // Top bar clears the notch; the sticky header sticks below it.
    await expect(page.locator('div.on-blue.bg-primary').first()).toHaveCSS('padding-top', '44px');
    await expect(page.locator('header').first()).toHaveCSS('top', '44px');
    await expect(page.locator('footer').first()).toHaveCSS('padding-bottom', '34px');

    // The report button (a bottom-fixed control) clears the home indicator and the side inset.
    const report = page.getByRole('button', { name: 'Reportar' });
    await expect(report).toBeVisible();
    await expect(report).toHaveCSS('bottom', '50px'); // 16 + 34
    await expect(report).toHaveCSS('right', '63px'); // 16 + 47

    await page.screenshot({ path: testInfo.outputPath('insets-home.png'), fullPage: false });
  });

  test('the filter sheet footer clears the home indicator', async ({ page }) => {
    await openAsInstalledApp(page);
    await page.goto('/activities');
    await page.addStyleTag({ content: ':root{--safe-bottom:34px}' });
    await page.getByRole('button', { name: 'Filtros', exact: true }).click();
    const footer = page.getByRole('dialog').locator('div.sticky.bottom-0');
    await expect(footer).toBeVisible();
    // 0.75rem (12px) of its own padding plus the inset.
    await expect(footer).toHaveCSS('padding-bottom', '46px');
  });

  test('back from an activity returns to the catalogue with its search kept', async ({ page }) => {
    await openAsInstalledApp(page);
    await page.goto('/activities');
    const search = page.getByRole('searchbox', { name: 'Pesquisar atividades...' });
    await search.fill('a');
    const firstCard = page.locator('main a[href^="/activities/"]').first();
    await expect(firstCard).toBeVisible();

    await firstCard.click();
    await expect(page).toHaveURL(/\/activities\/[0-9a-f-]{36}$/);
    const back = page.getByRole('button', { name: 'Voltar às atividades' });
    await expect(back).toBeVisible();

    await back.click();
    await expect(page).toHaveURL(/\/activities\/?$/);
    await expect(page.getByRole('searchbox', { name: 'Pesquisar atividades...' })).toHaveValue('a');
  });

  test('without standalone mode there is no in-app back control', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/activities');
    await page.locator('main a[href^="/activities/"]').first().click();
    await expect(page).toHaveURL(/\/activities\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Voltar às atividades' })).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('data-display-mode', 'browser');
  });

  test('Excel and PDF exports still download from a standalone window', async ({ page }) => {
    test.setTimeout(120_000);
    await openAsInstalledApp(page);
    const login = await signInE2E(page.request, { name: 'Chefe Standalone' });
    if (login.status() === 404) test.skip(true, 'E2E session helper is disabled (production)');
    expect(login.ok()).toBeTruthy();

    try {
      const created = await page.request.post('/api/programs', {
        data: { name: `E2E Exportar ${Date.now()}`, date: '2026-11-14', start_time: '09:30' },
      });
      expect(created.ok()).toBeTruthy();
      const body = (await created.json()) as { program?: { id: string }; id?: string; data?: { id: string } };
      const programId = body.program?.id ?? body.data?.id ?? body.id;
      expect(programId).toBeTruthy();

      const activity = await page.request.get('/api/activities?limit=1');
      const activityId = ((await activity.json()) as { activities: { id: string }[] }).activities[0]!.id;
      const entry = await page.request.post(`/api/programs/${programId}/entries`, {
        data: { entry_type: 'activity', activity_id: activityId },
      });
      expect(entry.ok()).toBeTruthy();

      await page.goto(`/programs/${programId}`);

      const excel = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Exportar Excel' }).click();
      expect((await excel).suggestedFilename()).toMatch(/\.xlsx$/);

      const pdf = page.waitForEvent('download', { timeout: 90_000 });
      await page.getByRole('button', { name: 'Exportar PDF' }).click();
      expect((await pdf).suggestedFilename()).toMatch(/\.pdf$/);
      // Still on the program page, not on a blank one.
      await expect(page).toHaveURL(new RegExp(`/programs/${programId}`));
    } finally {
      await signOutE2E(page.request);
    }
  });
});

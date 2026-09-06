import { test, expect } from '@playwright/test';

test.describe('Mobile layout', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'Mobile Chrome' && testInfo.project.name !== 'Mobile Safari',
      'Runs on Playwright mobile projects only'
    );
  });

  test('header menu and activities stay usable', async ({ page }) => {
    await page.goto('/activities');
    await expect(page.getByRole('heading', { name: 'Atividades' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir menu' })).toBeVisible();
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await expect(page.getByRole('link', { name: 'Programas públicos' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('link', { name: 'Programas públicos' })).toHaveCount(0);

    const box = page.viewportSize();
    expect(box?.width).toBeLessThan(768);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('sign-in does not stack a second header', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.getByRole('heading', { name: 'Iniciar Sessão' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir menu' })).toHaveCount(0);
  });
});

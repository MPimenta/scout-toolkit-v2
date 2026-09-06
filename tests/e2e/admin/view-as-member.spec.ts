import { test, expect } from '@playwright/test';

test.describe('View as member', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'View-as E2E runs on desktop Chromium only');
  });

  test('admin can preview member chrome and return', async ({ page }) => {
    const login = await page.request.post('/api/e2e/session', {
      data: {
        email: `e2e.viewas.${crypto.randomUUID()}@example.com`,
        name: 'Chefe Admin',
        role: 'admin',
      },
    });
    if (login.status() === 404) {
      test.skip(true, 'E2E session helper is disabled (production)');
    }
    expect(login.ok()).toBeTruthy();

    try {
      await page.goto('/activities');
      await expect(page.getByRole('link', { name: 'Administração' })).toBeVisible();

      await page.getByRole('button', { name: 'Chefe Admin' }).click();
      await page.getByRole('menuitem', { name: 'Ver como membro' }).click();
      await expect(page.getByRole('link', { name: 'Administração' })).toHaveCount(0);
      await expect(page.getByText('A ver como membro')).toBeVisible();

      await page.goto('/admin');
      await expect(page.getByRole('heading', { name: 'Acesso recusado' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Painel de Administração' })).toHaveCount(0);

      await page.getByRole('button', { name: 'Voltar à vista de admin' }).click();
      await expect(page.getByRole('link', { name: 'Administração' })).toBeVisible();

      await page.goto('/admin');
      await expect(page.getByRole('heading', { name: 'Painel de Administração' })).toBeVisible();
    } finally {
      await page.request.delete('/api/e2e/session');
    }
  });
});

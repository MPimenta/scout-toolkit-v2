import { test, expect } from '@playwright/test';

test.describe('Admin taxonomies', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Admin E2E runs on desktop Chromium only');
  });

  test('has no activity-types tab, and the catalogue filters are by format and focus', async ({ page }) => {
    const login = await page.request.post('/api/e2e/session', {
      data: {
        email: `e2e.admin.${crypto.randomUUID()}@example.com`,
        name: 'Chefe Admin',
        role: 'admin',
      },
    });
    if (login.status() === 404) {
      test.skip(true, 'E2E session helper is disabled (production)');
    }
    expect(login.ok()).toBeTruthy();

    try {
      await page.goto('/admin/taxonomias');
      await expect(page.getByRole('heading', { name: 'Taxonomias' })).toBeVisible();
      for (const tab of ['Áreas', 'Objetivos', 'ODS']) {
        await expect(page.getByRole('button', { name: tab })).toBeVisible();
      }
      await expect(page.getByRole('button', { name: 'Tipos' })).toHaveCount(0);

      // The taxonomy of activity types no longer exists, for readers or for admins
      expect((await page.request.get('/api/taxonomies/activity-types')).status()).toBe(404);
      const write = await page.request.post('/api/admin/taxonomies/activity-types', { data: { name: 'Tipo', code: 'TIPO' } });
      expect(write.status()).toBe(404);

      // Filters are by format and focus
      await page.goto('/activities');
      await page.getByRole('button', { name: /Expandir|Filtros/ }).first().click();
      await expect(page.getByText('Formato').first()).toBeVisible();
      await expect(page.getByText('Foco').first()).toBeVisible();
      await expect(page.getByText(/^Tipo de [Aa]tividade$/)).toHaveCount(0);
    } finally {
      await page.request.delete('/api/e2e/session');
    }
  });
});

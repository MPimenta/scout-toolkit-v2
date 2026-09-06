import { test, expect } from '@playwright/test';

test.describe('Admin taxonomies', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Admin E2E runs on desktop Chromium only');
  });

  test('creates an activity type visible in filters', async ({ page }) => {
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

    const name = `Tipo E2E ${Date.now()}`;
    const code = `E2E${Date.now().toString().slice(-6)}`;

    try {
      await page.goto('/admin/taxonomias');
      await expect(page.getByRole('heading', { name: 'Taxonomias' })).toBeVisible();
      await page.getByRole('button', { name: 'Tipos' }).click();
      await page.getByPlaceholder('Nome').fill(name);
      await page.getByPlaceholder('Código').fill(code);
      await page.getByRole('button', { name: 'Adicionar' }).click();
      await expect(page.getByText(name)).toBeVisible();

      await page.goto('/activities');
      await page.getByRole('button', { name: /Expandir|Filtros/ }).first().click();
      await expect(page.getByText(name)).toBeVisible();
    } finally {
      await page.request.delete('/api/e2e/session');
    }
  });
});

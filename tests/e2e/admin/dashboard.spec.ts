import { test, expect } from '@playwright/test';

test.describe('Admin dashboard', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Admin E2E runs on desktop Chromium only');
  });

  test('blocks a signed-in non-admin', async ({ page }) => {
    const login = await page.request.post('/api/e2e/session', {
      data: {
        email: `e2e.admin.${crypto.randomUUID()}@example.com`,
        name: 'Chefe Regular',
        role: 'user',
      },
    });
    if (login.status() === 404) {
      test.skip(true, 'E2E session helper is disabled (production)');
    }
    expect(login.ok()).toBeTruthy();

    try {
      await page.goto('/admin');
      await expect(page.getByRole('heading', { name: 'Acesso recusado' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Painel de Administração' })).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Administração' })).toHaveCount(0);
    } finally {
      await page.request.delete('/api/e2e/session');
    }
  });

  test('shows the dashboard for an admin', async ({ page }) => {
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
      await page.goto('/admin');
      await expect(page.getByRole('heading', { name: 'Painel de Administração' })).toBeVisible();
      await expect(page.getByText('Atividades pendentes')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Administração' })).toBeVisible();
    } finally {
      await page.request.delete('/api/e2e/session');
    }
  });
});

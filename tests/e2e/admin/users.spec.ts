import { test, expect } from '@playwright/test';

test.describe('Admin users', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Admin E2E runs on desktop Chromium only');
  });

  test('lists users and changes a role', async ({ page }) => {
    const targetEmail = `e2e.target.${crypto.randomUUID()}@example.com`;
    const target = await page.request.post('/api/e2e/session', {
      data: { email: targetEmail, name: 'Chefe Alvo', role: 'user' },
    });
    if (target.status() === 404) {
      test.skip(true, 'E2E session helper is disabled (production)');
    }
    expect(target.ok()).toBeTruthy();
    const targetBody = (await target.json()) as { userId: string };
    await page.request.delete('/api/e2e/session');

    const login = await page.request.post('/api/e2e/session', {
      data: {
        email: `e2e.admin.${crypto.randomUUID()}@example.com`,
        name: 'Chefe Admin',
        role: 'admin',
      },
    });
    expect(login.ok()).toBeTruthy();

    try {
      const patched = await page.request.patch(`/api/admin/users/${targetBody.userId}`, {
        data: { role: 'admin' },
      });
      expect(patched.ok()).toBeTruthy();

      await page.goto('/admin/utilizadores');
      await expect(page.getByRole('heading', { name: 'Utilizadores' })).toBeVisible();
    } finally {
      await page.request.delete('/api/e2e/session');
    }
  });
});

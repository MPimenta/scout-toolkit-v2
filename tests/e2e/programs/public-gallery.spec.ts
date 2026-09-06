import { test, expect } from '@playwright/test';

test.describe('Public program gallery', () => {
  test('lets a guest browse and preview', async ({ page }) => {
    await page.goto('/programs/public');
    await expect(page.getByRole('heading', { name: 'Programas públicos' })).toBeVisible();
    await expect(page.getByLabel('Pesquisar programas públicos')).toBeVisible();

    const firstCard = page.locator('a').filter({ hasText: /min|entradas/i }).first();
    if (await firstCard.count()) {
      await firstCard.click();
      await expect(page.getByRole('button', { name: 'Usar como modelo' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Editar' })).toHaveCount(0);
    }
  });
});

test.describe('Copy public program', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Copy E2E runs on desktop Chromium only');
  });

  test('copies a public program into a private draft', async ({ page }) => {
    const login = await page.request.post('/api/e2e/session', {
      data: {
        email: `e2e.copy.${crypto.randomUUID()}@example.com`,
        name: 'Chefe Cópia',
      },
    });
    if (login.status() === 404) {
      test.skip(true, 'E2E session helper is disabled (production)');
    }
    expect(login.ok()).toBeTruthy();

    try {
      const list = await page.request.get('/api/programs/public?limit=1');
      expect(list.ok()).toBeTruthy();
      const body = (await list.json()) as { programs: { id: string }[] };
      const programId = body.programs[0]?.id;
      if (!programId) {
        test.skip(true, 'No public programs available');
      }

      const copy = await page.request.post(`/api/programs/public/${programId}/copy`);
      expect(copy.status()).toBe(201);
      const created = (await copy.json()) as { program: { id: string; is_public: boolean } };
      expect(created.program.is_public).toBe(false);

      await page.goto(`/programs/${created.program.id}`);
      await expect(page.getByText(/cópia|privado|Program Builder/i).first()).toBeVisible();
    } finally {
      await page.request.delete('/api/e2e/session');
    }
  });
});

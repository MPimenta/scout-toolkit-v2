import { expect, test } from '@playwright/test';
import { signInE2E, signOutE2E } from '../helpers/session';

test.describe('Create Orgo event dialog', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Orgo dialog E2E runs on desktop Chromium only');
  });

  test('owner opens the dialog and sees end and unit, not timezone or tickets', async ({ page }) => {
    const login = await signInE2E(page.request, { name: 'Chefe Orgo' });
    if (login.status() === 404) {
      test.skip(true, 'E2E session helper is disabled (production)');
    }
    expect(login.ok()).toBeTruthy();

    const created = await page.request.post('/api/programs', {
      data: { name: `E2E Orgo ${Date.now()}`, date: '2026-07-12', start_time: '09:00', is_public: false },
    });
    expect(created.status()).toBe(201);
    const body = (await created.json()) as { program: { id: string } };

    try {
      await page.goto(`/programs/${body.program.id}`);
      await page.getByRole('button', { name: 'Criar evento no eAEP' }).click();
      await expect(page.getByRole('heading', { name: 'Criar evento no eAEP' })).toBeVisible();
      await expect(page.getByLabel('Fim')).toBeVisible();
      await expect(page.getByLabel('Unidade Orgo')).toBeVisible();
      await expect(page.getByLabel('Local')).toBeVisible();
      await expect(page.getByText(/timezone|preço|bilhete|ticket/i)).toHaveCount(0);
      await expect(page).toHaveURL(new RegExp(`/programs/${body.program.id}`));
    } finally {
      await page.request.delete(`/api/programs/${body.program.id}`).catch(() => undefined);
      await signOutE2E(page.request);
    }
  });

  test('guest does not see the create control', async ({ page }) => {
    await page.goto('/programs');
    await expect(page.getByRole('button', { name: 'Criar evento no eAEP' })).toHaveCount(0);
  });
});

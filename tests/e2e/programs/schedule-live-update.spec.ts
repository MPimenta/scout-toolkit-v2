import { test, expect } from '@playwright/test';
import { signInE2E, signOutE2E } from '../helpers/session';

test.describe('Program schedule live update', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Schedule E2E runs on desktop Chromium only');
  });

  test('adds and removes an activity without reloading', async ({ page }) => {
    const login = await signInE2E(page.request, { name: 'Chefe Agenda' });
    if (login.status() === 404) {
      test.skip(true, 'E2E session helper is disabled (production)');
    }
    expect(login.ok()).toBeTruthy();

    const catalogue = await page.request.get('/api/activities?limit=1');
    expect(catalogue.ok()).toBeTruthy();
    const { activities } = (await catalogue.json()) as { activities: { id: string; name: string }[] };
    const activity = activities[0];
    if (!activity) {
      test.skip(true, 'No activities available');
    }

    const created = await page.request.post('/api/programs', {
      data: { name: `E2E Agenda ${Date.now()}`, start_time: '09:00', is_public: false },
    });
    expect(created.status()).toBe(201);
    const body = (await created.json()) as { program: { id: string } };

    try {
      await page.goto(`/programs/${body.program.id}`);
      await expect(page.getByText('Nenhuma entrada no programa ainda.')).toBeVisible();

      await page.getByRole('button', { name: 'Adicionar Atividade' }).click();
      await expect(page.getByRole('button', { name: 'Adicionar ao programa' }).first()).toBeVisible();
      await expect(page.getByText('[object Object]')).toHaveCount(0);
      await page.getByRole('button', { name: 'Adicionar ao programa' }).first().click();

      await expect(page.locator('table').getByText(activity.name)).toBeVisible();
      await expect(page.getByText('Nenhuma entrada no programa ainda.')).toHaveCount(0);

      await page.getByRole('button', { name: 'Eliminar entrada' }).click();
      await expect(page.getByText('Nenhuma entrada no programa ainda.')).toBeVisible();
      await expect(page.locator('table').getByText(activity.name)).toHaveCount(0);
    } finally {
      await page.request.delete(`/api/programs/${body.program.id}`).catch(() => undefined);
      await signOutE2E(page.request);
    }
  });
});

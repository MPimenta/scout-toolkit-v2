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
      await page.getByRole('button', { name: 'Tipos', exact: true }).click();
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

  test('creates a challenge type and challenge visible in activity filters', async ({ page }) => {
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

    const typeName = `Tipo desafio E2E ${Date.now()}`;
    const challengeName = `Desafio E2E ${Date.now()}`;

    try {
      await page.goto('/admin/taxonomias');
      await expect(page.getByRole('heading', { name: 'Taxonomias' })).toBeVisible();
      await page.getByRole('button', { name: 'Tipos de desafio' }).click();
      await expect(page.getByPlaceholder('Nome')).toBeVisible();

      const typeResponse = await page.request.post('/api/admin/taxonomies/challenge-types', {
        data: { name: typeName },
      });
      expect(typeResponse.status()).toBe(201);
      const createdType = (await typeResponse.json()) as { item: { id: string } };

      await page.getByRole('button', { name: 'Desafios' }).click();
      const challengeResponse = await page.request.post('/api/admin/taxonomies/challenges', {
        data: {
          name: challengeName,
          description: 'Desafio criado no E2E',
          type_id: createdType.item.id,
        },
      });
      expect(challengeResponse.status()).toBe(201);

      await page.reload();
      await page.getByRole('button', { name: 'Desafios' }).click();
      await expect(page.getByText(challengeName)).toBeVisible();
    } finally {
      await page.request.delete('/api/e2e/session');
    }

    await page.goto('/activities');
    await expect(page.getByRole('heading', { name: 'Atividades' })).toBeVisible();
    await page.getByRole('button', { name: /Expandir|Filtros/ }).first().click();
    await expect(page.getByText(challengeName)).toBeVisible();
  });
});

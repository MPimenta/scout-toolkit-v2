import { test, expect } from '@playwright/test';

test.describe('Issue reports', () => {
  test('guest can open Reportar on activities and submit', async ({ page }) => {
    await page.goto('/activities');
    await page.getByRole('button', { name: 'Reportar' }).click();
    await expect(page.getByRole('heading', { name: 'Enviar um reporte' })).toBeVisible();
    await page.getByLabel('Tipo').selectOption('ideia');
    await page.getByLabel('Mensagem').fill('O filtro de idade não aparece no telemóvel.');
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page.getByText('Obrigado. Recebemos o teu reporte.')).toBeVisible();
  });

  test('Reportar is available on sign-in', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.getByRole('button', { name: 'Reportar' })).toBeVisible();
    await page.getByRole('button', { name: 'Reportar' }).click();
    await expect(page.getByRole('heading', { name: 'Enviar um reporte' })).toBeVisible();
  });

  test('launcher stays tappable at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/activities');
    const launcher = page.getByRole('button', { name: 'Reportar' });
    await expect(launcher).toBeVisible();
    await launcher.click();
    await expect(page.getByRole('heading', { name: 'Enviar um reporte' })).toBeVisible();
  });

  test('admin can close a report from the queue', async ({ page }) => {
    test.skip(test.info().project.name !== 'chromium', 'Admin queue E2E runs on desktop Chromium only');

    const created = await page.request.post('/api/reports', {
      data: {
        kind: 'conteudo',
        message: 'O nome da atividade está errado no catálogo.',
        path: '/activities',
        locale: 'pt',
        viewport: '1280x720',
      },
    });
    expect(created.ok()).toBeTruthy();

    const login = await page.request.post('/api/e2e/session', {
      data: {
        email: `e2e.reports.${crypto.randomUUID()}@example.com`,
        name: 'Chefe Admin',
        role: 'admin',
      },
    });
    if (login.status() === 404) {
      test.skip(true, 'E2E session helper is disabled (production)');
    }
    expect(login.ok()).toBeTruthy();

    try {
      await page.goto('/admin/reportes');
      await expect(page.getByRole('heading', { name: 'Reportes' })).toBeVisible();
      await expect(page.getByText('/activities').first()).toBeVisible();
      await page.getByRole('button', { name: 'Marcar fechado' }).first().click();
      await page.getByLabel('Só abertos').uncheck();
      await expect(page.getByText('fechado').first()).toBeVisible();
    } finally {
      await page.request.delete('/api/e2e/session');
    }
  });
});

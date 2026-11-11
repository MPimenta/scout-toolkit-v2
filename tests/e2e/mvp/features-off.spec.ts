import { test, expect } from '@playwright/test';
import { signInE2E, signOutE2E } from '../helpers/session';

/**
 * Runs against the server with FEATURES unset (the MVP default): every non-MVP feature is off.
 */
test.describe('Non-MVP features are hidden', () => {
  for (const path of ['/programs/public', '/atividades/propor', '/atividades/minhas', '/api/docs']) {
    test(`page ${path} is a 404`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
    });
  }

  for (const path of ['/api/programs/public', '/api/metrics', '/api/docs.json', '/api/activities/mine']) {
    test(`API GET ${path} answers 404`, async ({ request }) => {
      expect((await request.get(path)).status()).toBe(404);
    });
  }

  test('POST /api/reports answers 404', async ({ request }) => {
    expect((await request.post('/api/reports', { data: { message: 'olá, isto é um teste' } })).status()).toBe(404);
  });

  test('public health stays available', async ({ request }) => {
    expect((await request.get('/api/health')).status()).not.toBe(404);
  });

  test('taxonomy lists for the filters stay available', async ({ request }) => {
    expect((await request.get('/api/taxonomies/sdgs')).ok()).toBeTruthy();
  });

  test('header: no locale switcher, no public gallery, no Reportar', async ({ page }) => {
    await page.goto('/home');
    await expect(page.locator('header').getByRole('link', { name: 'Atividades', exact: true })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Idioma' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Programas públicos' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Reportar' })).toHaveCount(0);
  });

  test('an English cookie is ignored while english-locale is off', async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: 'kit-locale', value: 'en', url: baseURL! }]);
    await page.goto('/home');
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt');
    await expect(page.getByRole('link', { name: 'Atividades', exact: true }).first()).toBeVisible();
  });

  test('activities page: no proposals, no table toggle, no dev notes', async ({ page }) => {
    await page.goto('/activities');
    await expect(page.getByRole('searchbox', { name: 'Pesquisar atividades...' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Propor atividade' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'As minhas propostas' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Tabela' })).toHaveCount(0);
    await expect(page.getByText('Funcionalidade em Desenvolvimento')).toHaveCount(0);
  });

  test('admin dashboard links only to activities and users', async ({ page }) => {
    expect((await signInE2E(page.request, { name: 'Admin MVP', role: 'admin' })).ok()).toBeTruthy();
    try {
      await page.goto('/admin');
      await expect(page.getByRole('link', { name: 'Utilizadores', exact: true })).toBeVisible();
      for (const hidden of ['Taxonomias', 'Sugestões', 'Reportes']) {
        await expect(page.getByRole('link', { name: hidden })).toHaveCount(0);
      }
      expect((await page.goto('/admin/taxonomias'))?.status()).toBe(404);
      expect((await page.goto('/admin/reportes'))?.status()).toBe(404);
    } finally {
      await signOutE2E(page.request);
    }
  });

  test('program form has no public toggle', async ({ page }) => {
    expect((await signInE2E(page.request, { name: 'Chefe Privado' })).ok()).toBeTruthy();
    try {
      await page.goto('/programs');
      await page.getByRole('button', { name: /novo programa|criar primeiro programa/i }).first().click();
      await expect(page.getByLabel('Nome do Programa *')).toBeVisible();
      await expect(page.getByLabel(/programa público/i)).toHaveCount(0);
    } finally {
      await signOutE2E(page.request);
    }
  });
});

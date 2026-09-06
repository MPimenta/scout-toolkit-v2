import { test, expect } from '@playwright/test';
import { signInE2E, signOutE2E } from '../helpers/session';

test.describe('Programs as guest', () => {
  test('shows the feature showcase and Entrar', async ({ page }) => {
    await page.goto('/programs');
    await expect(page.getByRole('heading', { name: 'Criador de Programas' })).toBeVisible();
    await expect(page.getByText('Cronogramas Inteligentes', { exact: true })).toBeVisible();
    await expect(page.getByText('Gestão de Atividades', { exact: true })).toBeVisible();
    await expect(page.getByText('Objetivos Educativos', { exact: true })).toBeVisible();
    await expect(page.getByText('Exportação Profissional', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' }).first()).toBeVisible();
  });
});

test.describe('Programs when signed in', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Signed-in program E2E runs on desktop Chromium only');
  });

  test('creates and deletes a private program', async ({ page }) => {
    const login = await signInE2E(page.request, { name: 'Chefe Programas' });
    if (login.status() === 404) {
      test.skip(true, 'E2E session helper is disabled (production)');
    }
    expect(login.ok()).toBeTruthy();

    const name = `E2E Programa ${Date.now()}`;
    try {
      await page.goto('/programs');
      await expect(page.getByRole('heading', { name: 'Meus Programas' })).toBeVisible();
      await page.getByRole('button', { name: /novo programa|criar primeiro programa/i }).first().click();
      await expect(page.getByText('Criar Novo Programa')).toBeVisible();

      await page.getByLabel('Nome do Programa *').fill(name);
      await page.getByRole('button', { name: 'Criar Programa' }).click();

      await expect(page).toHaveURL(/\/programs\/[0-9a-f-]{36}/i);
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
      await expect(page.getByText('Programa Privado')).toBeVisible();

      await page.getByRole('button', { name: 'Eliminar' }).click();
      await expect(page.getByText(/tem a certeza/i)).toBeVisible();
      await page.getByRole('button', { name: 'Eliminar Programa' }).click();
      await expect(page).toHaveURL(/\/programs\/?$/);
      await expect(page.getByText(name)).toHaveCount(0);
    } finally {
      await signOutE2E(page.request);
    }
  });

  test('can cancel the create form', async ({ page }) => {
    const login = await signInE2E(page.request, { name: 'Chefe Cancelar' });
    if (login.status() === 404) {
      test.skip(true, 'E2E session helper is disabled (production)');
    }
    expect(login.ok()).toBeTruthy();

    try {
      await page.goto('/programs');
      await page.getByRole('button', { name: /novo programa|criar primeiro programa/i }).first().click();
      await page.getByLabel('Nome do Programa *').fill('Não gravar');
      await page.getByRole('button', { name: 'Cancelar' }).click();
      await expect(page.getByText('Criar Novo Programa')).toHaveCount(0);
      await expect(page.getByText('Não gravar')).toHaveCount(0);
    } finally {
      await signOutE2E(page.request);
    }
  });
});

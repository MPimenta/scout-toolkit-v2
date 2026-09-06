import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('shows Entrar on the home page when signed out', async ({ page }) => {
    await page.goto('/home');
    await expect(page.getByRole('heading', { name: 'Kit de Atividades' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('sign-in page is Portuguese-only and has no stacked header', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.getByRole('heading', { name: 'Iniciar Sessão' })).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar com o eaep/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir menu' })).toHaveCount(0);
  });

  test('header navigation uses unprefixed Portuguese routes', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Desktop nav is hidden behind the mobile sheet');
    await page.goto('/home');
    await page.locator('header').getByRole('link', { name: 'Atividades', exact: true }).click();
    await expect(page).toHaveURL(/\/activities/);
    await expect(page.getByRole('heading', { name: 'Atividades' })).toBeVisible();

    await page.locator('header').getByRole('link', { name: 'Programas', exact: true }).click();
    await expect(page).toHaveURL(/\/programs/);
    await expect(page.getByRole('heading', { name: 'Criador de Programas' })).toBeVisible();
  });
});

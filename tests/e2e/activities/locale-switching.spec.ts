import { expect, test } from '@playwright/test';

test.describe('Locale switcher', () => {
  test('switches PT to EN to PT on /activities without a locale prefix', async ({ page }, testInfo) => {
    const isMobile = testInfo.project.name === 'Mobile Chrome';

    await page.goto('/activities');
    await expect(page).toHaveURL(/\/activities$/);
    await expect(page.getByRole('heading', { name: 'Atividades' })).toBeVisible();
    await expect(page.getByText('Explore centenas de atividades para todas as idades e objetivos educativos.')).toBeVisible();
    await expect(page.getByRole('group', { name: 'Idioma' })).toBeVisible();

    await page.getByRole('group', { name: 'Idioma' }).getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page).toHaveURL(/\/activities$/);
    await expect(page.getByRole('heading', { name: 'Activities' })).toBeVisible();
    await expect(page.getByText('Browse hundreds of activities for every age and educational goal.')).toBeVisible();
    await expect(page.getByRole('group', { name: 'Language' })).toBeVisible();

    if (isMobile) {
      await page.getByRole('button', { name: 'Open menu' }).click();
    }
    await expect(page.getByRole('link', { name: 'Activities', exact: true }).first()).toBeVisible();
    if (isMobile) {
      await page.getByRole('button', { name: 'Fechar' }).click();
    }

    await page.getByRole('group', { name: 'Language' }).getByRole('button', { name: 'PT', exact: true }).click();
    await expect(page).toHaveURL(/\/activities$/);
    await expect(page.getByRole('heading', { name: 'Atividades' })).toBeVisible();
  });
});

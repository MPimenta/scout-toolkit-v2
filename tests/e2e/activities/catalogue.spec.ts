import { test, expect } from '@playwright/test';

test.describe('Activity catalogue cards', () => {
  test('Enter on a focused card opens the activity', async ({ page }) => {
    await page.goto('/activities');
    const firstCardLink = page.locator('main a[href^="/activities/"]').first();
    await expect(firstCardLink).toBeVisible();
    await firstCardLink.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/activities\/[0-9a-f-]{36}$/);
  });

  test('clicking the description area opens the activity, and no dev notes show', async ({ page }) => {
    await page.goto('/activities');
    await expect(page.getByText('Funcionalidade em Desenvolvimento')).toHaveCount(0);
    await expect(page.getByText('Ver Detalhes')).toHaveCount(0);

    // The title link's overlay covers the whole card; click where the description is drawn.
    const description = page.locator('main [data-slot="card-description"]').first();
    const box = await description.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await expect(page).toHaveURL(/\/activities\/[0-9a-f-]{36}$/);
  });

  test('on a phone, search leads, filters open in a sheet, and nothing scrolls sideways', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/activities');

    await expect(page.getByRole('searchbox', { name: 'Pesquisar atividades...' })).toBeVisible();
    await expect(page.getByText('Filtros de Atividades')).toHaveCount(0);

    await page.getByRole('button', { name: 'Filtros', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

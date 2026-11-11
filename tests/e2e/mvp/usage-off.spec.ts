import { test, expect } from '@playwright/test';

/** Runs against the server with FEATURES unset: no tracking, no visitor cookie. */
test.describe('Usage tracking is off by default', () => {
  test('browsing sets no visitor cookie and the events endpoint answers 404', async ({ page, request }) => {
    await page.goto('/activities');
    await page.getByPlaceholder('Pesquisar atividades por nome, descrição ou materiais...').fill('jogo');
    await page.waitForTimeout(1500);
    expect((await page.context().cookies()).find((c) => c.name === 'visitor_id')).toBeUndefined();

    const response = await request.post('/api/usage/events', { data: { type: 'search', text: 'jogo', filters: {}, result_count: 1 } });
    expect(response.status()).toBe(404);
  });

  test('the privacy page says nothing is recorded', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByText('De momento, a plataforma não regista dados de utilização.')).toBeVisible();
  });
});

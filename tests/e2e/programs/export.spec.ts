import { test, expect } from '@playwright/test';

const PROGRAM_ID = '550e8400-e29b-41d4-a716-446655440099';

test.describe('Program export', () => {
  test('mentions professional export on the programs showcase', async ({ page }) => {
    await page.goto('/programs');
    await expect(page.getByText('Exportação Profissional')).toBeVisible();
  });

  test('Excel export requires authentication', async ({ request }) => {
    const response = await request.get(`/api/programs/${PROGRAM_ID}/export/excel`);
    expect(response.status()).toBe(401);
  });

  test('PDF export requires authentication', async ({ request }) => {
    const response = await request.get(`/api/programs/${PROGRAM_ID}/export/pdf`);
    expect(response.status()).toBe(401);
  });

  test.skip('authenticated user can download Excel and PDF from the program page', async () => {
    // Needs a real eAEP/Orgo session cookie. Guest localStorage mocks do not satisfy Auth.js.
  });
});

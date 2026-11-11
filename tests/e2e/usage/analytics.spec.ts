import { test, expect } from '@playwright/test';
import { signInE2E, signOutE2E } from '../helpers/session';

test.describe('Admin usage page', () => {
  test('an administrator sees the figures; a member is refused', async ({ page, request }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'One browser is enough');

    // A visitor leaves a trace first.
    await page.goto('/activities');
    await page.getByPlaceholder('Pesquisar atividades por nome, descrição ou materiais...').fill('fogueira');
    await expect.poll(async () => (await page.context().cookies()).some((c) => c.name === 'visitor_id'), { timeout: 15_000 }).toBe(true);

    try {
      expect((await signInE2E(request, { role: 'user', email: `e2e.membro.${Date.now()}@example.com` })).ok()).toBeTruthy();
      expect((await request.get('/api/admin/usage/summary')).status()).toBe(403);
    } finally {
      await signOutE2E(request);
    }

    try {
      expect((await signInE2E(page.request, { role: 'admin', email: `e2e.admin.${Date.now()}@example.com`, name: 'Admin E2E' })).ok()).toBeTruthy();
      await page.goto('/admin');
      await page.getByRole('link', { name: 'Utilização' }).click();
      await expect(page.getByRole('heading', { name: 'Utilização' })).toBeVisible();
      await expect(page.getByText('Pesquisas mais frequentes')).toBeVisible();
      await expect(page.getByText(/Valores indicativos/)).toBeVisible();
      await page.getByRole('button', { name: '7 dias' }).click();
      await expect(page.getByRole('button', { name: '7 dias' })).toHaveAttribute('aria-pressed', 'true');
    } finally {
      await signOutE2E(page.request);
    }
  });
});

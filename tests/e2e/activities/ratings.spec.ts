import { test, expect } from '@playwright/test';
import { firstActivityId } from '../helpers/activity';

test.describe('Activity ratings (guest)', () => {
  test('shows the public ratings block and a sign-in prompt', async ({ page, request }) => {
    const activityId = await firstActivityId(request);
    await page.goto(`/activities/${activityId}`);

    await expect(page.getByRole('heading', { name: 'Avaliações' }).first()).toBeVisible();
    await expect(page.getByText(/Média/)).toBeVisible();
    await expect(page.getByText('Inicie sessão para avaliar esta atividade')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Iniciar Sessão' })).toBeVisible();
    await expect(page.getByText('Enviar Avaliação')).toHaveCount(0);
  });

  test('rejects an unauthenticated rating submit', async ({ request }) => {
    const activityId = await firstActivityId(request);
    const response = await request.post(`/api/activities/${activityId}/ratings`, {
      data: { rating: 4, comment: 'guest' },
    });
    expect(response.status()).toBe(401);
  });
});

test.describe('Activity ratings (signed-in)', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Signed-in ratings E2E runs on desktop Chromium only');
  });

  test('submit, vote, react, expand thread, and reply', async ({ page }) => {
    const login = await page.request.post('/api/e2e/session', {
      data: {
        email: `e2e.ratings.${crypto.randomUUID()}@example.com`,
        name: 'Chefe E2E',
      },
    });
    if (login.status() === 404) {
      test.skip(true, 'E2E session helper is disabled (production)');
    }
    expect(login.ok()).toBeTruthy();

    const activityId = await firstActivityId(page.request);
    const comment = `E2E avaliação ${Date.now()}`;
    const reply = `E2E resposta ${Date.now()}`;

    try {
      await page.goto(`/activities/${activityId}`);
      await expect(page.getByText('Avalie esta atividade')).toBeVisible();

      await page.getByLabel('4 estrelas').click();
      await page
        .getByPlaceholder('Partilhe a sua experiência com esta atividade...')
        .fill(comment);
      await page.getByRole('button', { name: 'Enviar Avaliação' }).click();

      await expect(page.getByText(comment).first()).toBeVisible();
      await expect(page.getByLabel('Voto positivo')).toBeVisible();
      await expect(page.getByLabel('Adorei')).toBeVisible();

      await page.getByLabel('Voto positivo').click();
      await expect(page.getByLabel('Voto positivo')).toHaveAttribute('aria-pressed', 'true');

      await page.getByLabel('Adorei').click();
      await expect(page.getByLabel('Adorei')).toHaveAttribute('aria-pressed', 'true');

      const threadToggle = page.getByRole('button', { name: /respostas?$/ }).first();
      await threadToggle.click();
      await expect(page.getByPlaceholder('Escreva uma resposta...')).toBeVisible();
      await page.getByPlaceholder('Escreva uma resposta...').fill(reply);
      await page.getByRole('button', { name: 'Enviar resposta' }).click();
      await expect(page.getByText(reply)).toBeVisible();
    } finally {
      await page.request.delete('/api/e2e/session');
    }
  });
});

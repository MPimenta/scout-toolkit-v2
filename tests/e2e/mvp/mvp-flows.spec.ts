import { test, expect } from '@playwright/test';
import { signInE2E, signOutE2E } from '../helpers/session';

/**
 * The five MVP flows end to end with every non-MVP feature off:
 * sign in -> browse and search -> rate and comment -> build a program -> push it to Orgo (stubbed).
 */
test('the MVP flows work with every flag off', async ({ page }) => {
  // Five journeys in one test on a cold dev server, which compiles each route on first use
  // (the Orgo options, create and attendance routes included). It takes about 33 s cold.
  test.setTimeout(60_000);

  // 1. Sign in (the e2e session stands in for the Orgo OAuth redirect)
  const login = await signInE2E(page.request, { name: 'Chefe MVP' });
  expect(login.ok()).toBeTruthy();

  const catalogue = await page.request.get('/api/activities?limit=1');
  const activity = ((await catalogue.json()) as { activities: { id: string; name: string }[] }).activities[0]!;
  let programId = '';

  try {
    // 2. Browse and search: a word at the end of the name still matches
    await page.goto('/activities');
    const word = activity.name.split(' ').at(-1)!;
    await page.getByRole('searchbox', { name: 'Pesquisar atividades...' }).fill(word);
    await expect(page.locator('main').getByRole('link', { name: activity.name }).first()).toBeVisible();

    // 3. Rate and comment (plain stars + comment: no votes, reactions or replies)
    await page.goto(`/activities/${activity.id}`);
    await page.getByRole('button', { name: '4 estrelas' }).click();
    await page.getByPlaceholder('Partilha a tua experiência com esta atividade...').fill('Resultou muito bem com os lobitos.');
    await page.getByRole('button', { name: 'Enviar Avaliação' }).click();
    await expect(page.getByText('Resultou muito bem com os lobitos.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Voto positivo' })).toHaveCount(0);
    await expect(page.getByText(/\d+ respostas?/)).toHaveCount(0);

    // 4. Build a program: add an activity from the builder, then see it on the schedule
    const created = await page.request.post('/api/programs', {
      data: { name: `E2E MVP ${Date.now()}`, date: '2026-11-14', start_time: '09:30', is_public: false },
    });
    programId = ((await created.json()) as { program: { id: string } }).program.id;
    await page.goto(`/programs/${programId}`);
    await page.getByRole('button', { name: 'Adicionar Atividade' }).click();
    await page.getByRole('button', { name: 'Adicionar ao programa' }).first().click();
    await expect(page.locator('table').getByText('09:30').first()).toBeVisible();

    // 5. Push it to Orgo
    await page.getByRole('button', { name: 'Criar evento no eAEP' }).click();
    await page.getByLabel('Unidade Orgo').click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: 'Criar no eAEP' }).click();
    await expect(page.getByRole('heading', { name: 'Evento criado no eAEP' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Abrir evento no eAEP' })).toBeVisible();
  } finally {
    if (programId) await page.request.delete(`/api/programs/${programId}`).catch(() => undefined);
    await signOutE2E(page.request);
  }
});

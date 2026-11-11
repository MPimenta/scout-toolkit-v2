import { test, expect } from '@playwright/test';
import postgres from 'postgres';
import { E2E_DATABASE_URL } from '../e2e-env';
import { signInE2E, signOutE2E } from '../helpers/session';

/** Runs with the usage-tracking flag on (FEATURES=all). Events are read straight from the e2e database. */
const sql = postgres(E2E_DATABASE_URL, { max: 1 });

test.afterAll(async () => {
  await sql.end();
});

async function eventsFor(visitor: string) {
  return sql<{ type: string; user_id: string | null; payload: Record<string, unknown> | null; activity_id: string | null }[]>`
    select type, user_id, payload, activity_id from usage_events where visitor_id = ${visitor} order by occurred_at`;
}

async function visitorId(page: import('@playwright/test').Page) {
  const cookie = (await page.context().cookies()).find((item) => item.name === 'visitor_id');
  return cookie?.value ?? null;
}

test.describe('Usage tracking', () => {
  test('a guest searches and opens an activity; a signed-in leader adds it to a program', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'One browser is enough for the recorded events');

    // The catalogue stays open: no sign-in is asked.
    await page.goto('/activities');
    await expect(page.getByRole('heading', { name: 'Atividades' })).toBeVisible();
    await page.getByPlaceholder('Pesquisar atividades por nome, descrição ou materiais...').fill('jogo');

    await expect.poll(() => visitorId(page), { timeout: 15_000 }).not.toBeNull();
    const visitor = (await visitorId(page))!;
    await expect.poll(async () => (await eventsFor(visitor)).filter((e) => e.type === 'search').length, {
      timeout: 15_000,
    }).toBe(1);
    const [search] = await eventsFor(visitor);
    expect(search!.payload).toMatchObject({ text: 'jogo' });
    expect(search!.user_id).toBeNull();

    // Open the first activity.
    await page.locator('main a[href^="/activities/"]').first().click();
    await expect(page).toHaveURL(/\/activities\/[0-9a-f-]{36}$/);
    await expect.poll(async () => (await eventsFor(visitor)).filter((e) => e.type === 'activity_view').length, {
      timeout: 15_000,
    }).toBe(1);
    const activityId = (await eventsFor(visitor)).find((e) => e.type === 'activity_view')!.activity_id!;

    // Sign in and add that activity to a program: the event is recorded by the server.
    const email = `e2e.usage.${Date.now()}@example.com`;
    try {
      expect((await signInE2E(page.request, { email, name: 'Maria Uso' })).ok()).toBeTruthy();
      const created = await page.request.post('/api/programs', {
        data: { name: `E2E uso ${Date.now()}`, date: '2026-11-14', start_time: '09:30', is_public: false },
      });
      const programId = ((await created.json()) as { program: { id: string } }).program.id;
      const added = await page.request.post(`/api/programs/${programId}/entries`, {
        data: { entry_type: 'activity', activity_id: activityId },
      });
      expect(added.status()).toBe(201);

      await expect.poll(async () => (await eventsFor(visitor)).filter((e) => e.type === 'program_add').length).toBe(1);
      // Signing in attributes the browser's earlier events to the user.
      await expect
        .poll(async () => (await eventsFor(visitor)).every((e) => e.user_id !== null), { timeout: 15_000 })
        .toBe(true);
    } finally {
      await signOutE2E(page.request);
    }
  });

  test('turning recording off on the privacy page stops tracking in that browser', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'One browser is enough');
    await page.goto('/privacy');
    await expect(page.getByText(/apagados ao fim de 13 meses/)).toBeVisible();
    await page.getByRole('button', { name: 'Desligar o registo neste browser' }).click();
    await expect(page.getByRole('status')).toContainText('desligado');

    await page.goto('/activities');
    await page.getByPlaceholder('Pesquisar atividades por nome, descrição ou materiais...').fill('fogueira');
    await expect(page.getByText('Pesquisa: fogueira')).toBeVisible();
    await page.waitForTimeout(2000);
    expect(await visitorId(page)).toBeNull();
  });
});

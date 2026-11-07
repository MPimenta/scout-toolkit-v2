import { test, expect, type APIRequestContext } from '@playwright/test';
import { signInE2E, signOutE2E } from '../helpers/session';

type ProgramEntry = { start_time: string; end_time: string; custom_title?: string | null; activity?: { id: string } | null };

async function programEntries(request: APIRequestContext, id: string): Promise<ProgramEntry[]> {
  const response = await request.get(`/api/programs/${id}`);
  expect(response.ok()).toBeTruthy();
  return ((await response.json()) as { program: { entries: ProgramEntry[] } }).program.entries;
}

test.describe('Program schedule times', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Runs on desktop Chromium only');
  });

  test('an activity added from its page lands last, timed from the program start', async ({ page }) => {
    expect((await signInE2E(page.request, { name: 'Chefe Horário' })).ok()).toBeTruthy();
    const catalogue = await page.request.get('/api/activities?limit=1');
    const activity = ((await catalogue.json()) as { activities: { id: string; name: string; approximate_duration_minutes: number }[] }).activities[0]!;

    const name = `E2E Horário ${Date.now()}`;
    const created = await page.request.post('/api/programs', { data: { name, start_time: '09:30', is_public: false } });
    const programId = ((await created.json()) as { program: { id: string } }).program.id;

    try {
      await page.request.post(`/api/programs/${programId}/entries`, {
        data: { entry_type: 'custom', custom_title: 'Abertura', custom_duration_minutes: 15 },
      });

      await page.goto(`/activities/${activity.id}`);
      await page.getByRole('button', { name: /adicionar ao programa/i }).first().click();
      await page.locator('#program-select').click();
      await page.getByRole('option', { name: new RegExp(name) }).click();
      await page.getByRole('button', { name: 'Adicionar ao Programa', exact: true }).click();
      await page.waitForURL(`**/programs/${programId}`);

      const entries = await programEntries(page.request, programId);
      expect(entries.map((e) => e.custom_title ?? e.activity?.id)).toEqual(['Abertura', activity.id]);
      expect(entries[1]!.start_time).toBe('09:45');
      const end = 9 * 60 + 45 + activity.approximate_duration_minutes;
      const hhmm = `${String(Math.floor(end / 60) % 24).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`;
      expect(entries[1]!.end_time).toBe(hhmm);
      await expect(page.locator('table').getByText('09:45').first()).toBeVisible();
    } finally {
      await page.request.delete(`/api/programs/${programId}`).catch(() => undefined);
      await signOutE2E(page.request);
    }
  });

  test('a reorder is saved without a save button and survives a reload', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    expect((await signInE2E(page.request, { name: 'Chefe Ordem' })).ok()).toBeTruthy();
    const created = await page.request.post('/api/programs', {
      data: { name: `E2E Ordem ${Date.now()}`, start_time: '10:00', is_public: false },
    });
    const programId = ((await created.json()) as { program: { id: string } }).program.id;

    try {
      for (const [title, minutes] of [['Primeiro', 30], ['Segundo', 15]] as const) {
        await page.request.post(`/api/programs/${programId}/entries`, {
          data: { entry_type: 'custom', custom_title: title, custom_duration_minutes: minutes },
        });
      }
      await page.goto(`/programs/${programId}`);
      await expect(page.getByText('Save Program')).toHaveCount(0);

      await page.getByRole('button', { name: 'Descer' }).first().click();
      await expect
        .poll(async () => (await programEntries(page.request, programId)).map((e) => e.custom_title))
        .toEqual(['Segundo', 'Primeiro']);

      await page.reload();
      const entries = await programEntries(page.request, programId);
      expect(entries.map((e) => `${e.custom_title} ${e.start_time}-${e.end_time}`)).toEqual([
        'Segundo 10:00-10:15',
        'Primeiro 10:15-10:45',
      ]);
    } finally {
      await page.request.delete(`/api/programs/${programId}`).catch(() => undefined);
      await signOutE2E(page.request);
    }
  });

  test('on a phone the program page does not scroll sideways and an entry can be removed', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    expect((await signInE2E(page.request, { name: 'Chefe Telemóvel' })).ok()).toBeTruthy();
    const created = await page.request.post('/api/programs', {
      data: { name: `E2E Telemóvel com um nome bastante comprido ${Date.now()}`, date: '2026-11-14', start_time: '09:30', is_public: false },
    });
    const programId = ((await created.json()) as { program: { id: string } }).program.id;

    try {
      for (const [title, minutes] of [['Abertura', 15], ['Jogo', 45], ['Lanche', 15]] as const) {
        await page.request.post(`/api/programs/${programId}/entries`, {
          data: { entry_type: 'custom', custom_title: title, custom_duration_minutes: minutes },
        });
      }
      await page.goto(`/programs/${programId}`);
      await expect(page.getByRole('button', { name: /^Remover / }).first()).toBeVisible();

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);

      // Remove the middle entry; the last one moves up.
      await page.getByRole('button', { name: /^Remover / }).nth(1).click();
      await expect
        .poll(async () => (await programEntries(page.request, programId)).map((e) => `${e.custom_title} ${e.start_time}-${e.end_time}`))
        .toEqual(['Abertura 09:30-09:45', 'Lanche 09:45-10:00']);
    } finally {
      await page.request.delete(`/api/programs/${programId}`).catch(() => undefined);
      await signOutE2E(page.request);
    }
  });
});

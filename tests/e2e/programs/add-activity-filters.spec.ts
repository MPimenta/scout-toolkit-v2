import { test, expect } from '@playwright/test';
import { signInE2E, signOutE2E } from '../helpers/session';

/**
 * Add-activity dialog (openspec: format-focus-everywhere): the catalogue is searched and filtered by the
 * server (title, description, materials and instructions; format; focus), and an activity that has a format
 * and a focus but no former type can be filtered and added.
 */
test.describe('Program builder: add an activity by format and focus', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Runs on desktop Chromium only');
  });

  test('searches the instructions, filters by format and by secondary focus, adds the activity and shows its kind', async ({ page }) => {
    const login = await signInE2E(page.request, { name: 'Chefe Agenda', role: 'admin' });
    if (login.status() === 404) test.skip(true, 'E2E session helper is disabled (production)');
    expect(login.ok()).toBeTruthy();

    const stamp = Date.now();
    const token = `lencoteste${stamp}`;
    const created: string[] = [];
    let programId = '';
    try {
      const formats = (await (await page.request.get('/api/taxonomies/activity-formats')).json()) as { activity_formats: { id: string; code: string; name: string }[] };
      const focuses = (await (await page.request.get('/api/taxonomies/activity-focuses')).json()) as { activity_focuses: { id: string; code: string; name: string }[] };
      const format = (code: string) => formats.activity_formats.find((f) => f.code === code)!;
      const focus = (code: string) => focuses.activity_focuses.find((f) => f.code === code)!;

      const make = async (name: string, data: Record<string, unknown>) => {
        const response = await page.request.post('/api/admin/activities', {
          data: {
            name,
            description: 'Descrição E2E',
            materials: 'Nada',
            approximate_duration_minutes: 20,
            group_sizes: ['small'],
            effort_level: 'low',
            locations: ['outside'],
            age_groups: ['scouts'],
            ...data,
          },
        });
        expect(response.status()).toBe(201);
        created.push(((await response.json()) as { activity: { id: string } }).activity.id);
      };
      const withInstructions = `E2E Jogo do ${stamp}`;
      const other = `E2E Outro ${stamp}`;
      await make(withInstructions, {
        instructions: `Cada patrulha guarda o seu ${token}`,
        format_id: format('jogo').id,
        focus_id: focus('cooperacao').id,
        secondary_focus_id: focus('comunicacao').id,
      });
      await make(other, { instructions: 'Outra coisa', format_id: format('quebra-gelo').id, focus_id: focus('confianca').id });

      const program = await page.request.post('/api/programs', { data: { name: `E2E Filtros ${stamp}`, start_time: '09:00', is_public: false } });
      programId = ((await program.json()) as { program: { id: string } }).program.id;

      await page.goto(`/programs/${programId}`);
      await page.getByRole('button', { name: 'Adicionar Atividade' }).click();
      const search = page.getByPlaceholder('Pesquisar atividades...');

      // The word is only in the instructions of one activity
      await search.fill(token);
      await expect(page.getByText(withInstructions)).toBeVisible();
      await expect(page.getByText(other)).toHaveCount(0);

      // Format and focus (the secondary focus counts); the dialog has no type filter
      await search.fill(String(stamp));
      await expect(page.getByText(withInstructions)).toBeVisible();
      await expect(page.getByText(other)).toBeVisible();
      await expect(page.getByLabel('Tipo de atividade')).toHaveCount(0);

      await page.getByLabel('Formato').click();
      await page.getByRole('option', { name: 'Quebra-gelo' }).click();
      await expect(page.getByText(other)).toBeVisible();
      await expect(page.getByText(withInstructions)).toHaveCount(0);

      await page.getByLabel('Formato').click();
      await page.getByRole('option', { name: 'Todos os formatos' }).click();
      await page.getByLabel('Foco', { exact: true }).click();
      await page.getByRole('option', { name: 'Comunicação' }).click();
      await expect(page.getByText(withInstructions)).toBeVisible();
      await expect(page.getByText(other)).toHaveCount(0);

      // The dialog shows the kind of each activity, and adding it puts it in the schedule
      await expect(page.getByText('Jogo · Cooperação · Comunicação')).toBeVisible();
      await page.getByRole('button', { name: 'Adicionar ao programa' }).first().click();
      await expect(page.locator('table').getByText(withInstructions)).toBeVisible();
    } finally {
      if (programId) await page.request.delete(`/api/programs/${programId}`).catch(() => undefined);
      for (const id of created) await page.request.delete(`/api/admin/activities/${id}`).catch(() => undefined);
      await signOutE2E(page.request);
    }
  });
});

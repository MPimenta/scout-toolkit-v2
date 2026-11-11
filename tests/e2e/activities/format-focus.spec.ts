import { test, expect } from '@playwright/test';

/**
 * Format and focus (openspec: reference-sheet-alignment): the catalogue filters by them, and a
 * desafio that is mandatory for integration is highlighted on the activity page.
 */
test.describe('Format, focus and integration', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Runs on desktop Chromium only');
  });

  test('filters the catalogue by format and by focus (main or secondary), and highlights an integration desafio', async ({ page }) => {
    const login = await page.request.post('/api/e2e/session', {
      data: { email: `e2e.formatfocus.${crypto.randomUUID()}@example.com`, name: 'Chefe Formato', role: 'admin' },
    });
    if (login.status() === 404) test.skip(true, 'E2E session helper is disabled (production)');
    expect(login.ok()).toBeTruthy();

    const created: string[] = [];
    try {
      const formats = (await (await page.request.get('/api/taxonomies/activity-formats')).json()) as { activity_formats: { id: string; code: string }[] };
      const focuses = (await (await page.request.get('/api/taxonomies/activity-focuses')).json()) as { activity_focuses: { id: string; code: string }[] };
      const challenges = (await (await page.request.get('/api/taxonomies/challenges')).json()) as { challenges: { id: string; code: string }[] };
      const format = (code: string) => formats.activity_formats.find((f) => f.code === code)!.id;
      const focus = (code: string) => focuses.activity_focuses.find((f) => f.code === code)!.id;
      const integrationChallenge = challenges.challenges.find((c) => c.code === 'VAL-D')!.id;

      const stamp = Date.now();
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
        const id = ((await response.json()) as { activity: { id: string } }).activity.id;
        created.push(id);
        return id;
      };
      const mainName = `E2E foco principal ${stamp}`;
      const secondaryName = `E2E foco secundário ${stamp}`;
      const otherName = `E2E outro foco ${stamp}`;
      await make(mainName, { format_id: format('energizante'), focus_id: focus('confianca'), secondary_focus_id: focus('comunicacao') });
      await make(secondaryName, { format_id: format('jogo'), focus_id: focus('comunicacao'), secondary_focus_id: focus('confianca') });
      const withChallenge = await make(otherName, {
        format_id: format('quebra-gelo'),
        focus_id: focus('comunicacao'),
        challenge_ids: [integrationChallenge],
      });

      // Focus: matches the main and the secondary focus
      await page.goto('/activities');
      await page.getByRole('searchbox', { name: 'Pesquisar atividades...' }).fill(String(stamp));
      await page.getByRole('button', { name: /expandir/i }).click();
      await page.getByRole('checkbox', { name: /^Confiança/ }).check();
      await expect(page.getByText(mainName)).toBeVisible();
      await expect(page.getByText(secondaryName)).toBeVisible();
      await expect(page.getByText(otherName)).toHaveCount(0);

      // Format narrows it down
      await page.getByRole('checkbox', { name: /^Energizante/ }).check();
      await expect(page.getByText(mainName)).toBeVisible();
      await expect(page.getByText(secondaryName)).toHaveCount(0);

      // A desafio mandatory for integration is highlighted, with the short title first
      await page.goto(`/activities/${withChallenge}`);
      await expect(page.getByText('Acumula 3 noites de campo.')).toBeVisible();
      await expect(page.getByTestId('integration-badge')).toContainText('Obrigatório para a integração');
    } finally {
      for (const id of created) await page.request.delete(`/api/admin/activities/${id}`);
      await page.request.delete('/api/e2e/session');
    }
  });
});

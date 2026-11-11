import { test, expect } from '@playwright/test';
import { formatAndFocus } from '../helpers/activity';

/**
 * Objectives per division (openspec: progress-matrix-objectives): an activity for two age groups
 * with an objective both share shows the objective under a coloured pill for each division.
 */
test.describe('Objectives per division', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Runs on desktop Chromium only');
  });

  test('shows one division tab per age group for a shared objective', async ({ page }) => {
    const login = await page.request.post('/api/e2e/session', {
      data: { email: `e2e.divisions.${crypto.randomUUID()}@example.com`, name: 'Chefe Divisões', role: 'admin' },
    });
    if (login.status() === 404) test.skip(true, 'E2E session helper is disabled (production)');
    expect(login.ok()).toBeTruthy();

    let createdId: string | null = null;
    try {
      const goalsBody = (await (await page.request.get('/api/taxonomies/educational-goals')).json()) as {
        educational_goals: { id: string; code: string; age_groups: string[] }[];
      };
      const shared = goalsBody.educational_goals.find((goal) => goal.age_groups.filter((group) => group !== 'leaders').length >= 2);
      expect(shared, 'the Matriz has objectives shared by two divisions').toBeTruthy();
      const groups = shared!.age_groups.filter((group) => group !== 'leaders').slice(0, 2);

      const response = await page.request.post('/api/admin/activities', {
        data: {
          name: `E2E divisões ${Date.now()}`,
          description: 'Descrição E2E',
          materials: 'Nada',
          approximate_duration_minutes: 20,
          group_sizes: ['small'],
          effort_level: 'low',
          locations: ['outside'],
          age_groups: groups,
          educational_goal_ids: [shared!.id],
          ...(await formatAndFocus(page.request)),
        },
      });
      expect(response.status()).toBe(201);
      createdId = ((await response.json()) as { activity: { id: string } }).activity.id;

      await page.goto(`/activities/${createdId}`);
      const tabs = page.getByRole('tab').filter({ has: page.locator('[data-slot="division-pill"]') });
      await expect(tabs).toHaveCount(2);
      for (const group of groups) {
        await expect(page.locator(`[role="tab"] [data-slot="division-pill"][data-age-group="${group}"]`)).toBeVisible();
      }
      await expect(page.getByText(shared!.code).first()).toBeVisible();
    } finally {
      if (createdId) await page.request.delete(`/api/admin/activities/${createdId}`);
      await page.request.delete('/api/e2e/session');
    }
  });
});

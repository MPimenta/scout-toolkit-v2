import { test, expect } from '@playwright/test';
import { firstActivityId } from '../helpers/activity';

test.describe('Edit suggestions', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Suggestion E2E runs on desktop Chromium only');
  });

  test('signed-in user suggests and admin accepts', async ({ page }) => {
    const login = await page.request.post('/api/e2e/session', {
      data: {
        email: `e2e.suggest.${crypto.randomUUID()}@example.com`,
        name: 'Chefe Sugestão',
      },
    });
    if (login.status() === 404) {
      test.skip(true, 'E2E session helper is disabled (production)');
    }
    expect(login.ok()).toBeTruthy();

    const activityId = await firstActivityId(page.request);
    const suggested = `Texto sugerido ${Date.now()}`;

    try {
      const created = await page.request.post(`/api/activities/${activityId}/suggestions`, {
        data: { field: 'description', suggested_value: suggested },
      });
      expect(created.status()).toBe(201);
      const suggestion = (await created.json()) as { suggestion: { id: string } };
      await page.request.delete('/api/e2e/session');

      const admin = await page.request.post('/api/e2e/session', {
        data: {
          email: `e2e.admin.${crypto.randomUUID()}@example.com`,
          name: 'Chefe Admin',
          role: 'admin',
        },
      });
      expect(admin.ok()).toBeTruthy();

      const reviewed = await page.request.post(`/api/admin/suggestions/${suggestion.suggestion.id}/review`, {
        data: { decision: 'approved' },
      });
      expect(reviewed.ok()).toBeTruthy();

      const activity = await page.request.get(`/api/activities/${activityId}`);
      const body = (await activity.json()) as { description: string };
      expect(body.description).toBe(suggested);
    } finally {
      await page.request.delete('/api/e2e/session');
    }
  });
});

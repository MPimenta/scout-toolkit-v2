import { test, expect } from '@playwright/test';

test.describe('Admin activities', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Admin E2E runs on desktop Chromium only');
  });

  test('creates and unpublishes an activity', async ({ page }) => {
    const login = await page.request.post('/api/e2e/session', {
      data: {
        email: `e2e.admin.${crypto.randomUUID()}@example.com`,
        name: 'Chefe Admin',
        role: 'admin',
      },
    });
    if (login.status() === 404) {
      test.skip(true, 'E2E session helper is disabled (production)');
    }
    expect(login.ok()).toBeTruthy();

    try {
      const types = await page.request.get('/api/taxonomies/activity-types');
      const typeBody = (await types.json()) as { activity_types: { id: string }[] };
      const typeId = typeBody.activity_types[0]?.id;
      if (!typeId) test.skip(true, 'No activity types available');

      const name = `E2E atividade ${Date.now()}`;
      const created = await page.request.post('/api/admin/activities', {
        data: {
          name,
          description: 'Descrição E2E',
          materials: 'Nada',
          approximate_duration_minutes: 20,
          group_size: 'small',
          effort_level: 'low',
          location: 'outside',
          age_group: 'scouts',
          activity_type_id: typeId,
        },
      });
      expect(created.status()).toBe(201);
      const activity = (await created.json()) as { activity: { id: string } };

      await page.request.patch(`/api/admin/activities/${activity.activity.id}`, {
        data: { is_approved: false },
      });

      const publicList = await page.request.get('/api/activities?search=' + encodeURIComponent(name));
      const listed = (await publicList.json()) as { activities: { id: string }[] };
      expect(listed.activities.some((item) => item.id === activity.activity.id)).toBe(false);

      await page.goto('/admin/atividades');
      await expect(page.getByRole('heading', { name: 'Atividades' })).toBeVisible();
      await expect(page.getByText(name)).toBeVisible();
    } finally {
      await page.request.delete('/api/e2e/session');
    }
  });
});

import { test, expect } from '@playwright/test';

test.describe('User-generated activities', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Propose E2E runs on desktop Chromium only');
  });

  test('user submits, guest cannot see it, admin approves', async ({ page }) => {
    const types = await page.request.get('/api/taxonomies/activity-types');
    const typeBody = (await types.json()) as { activity_types: { id: string }[] };
    const typeId = typeBody.activity_types[0]?.id;
    if (!typeId) test.skip(true, 'No activity types available');

    const login = await page.request.post('/api/e2e/session', {
      data: {
        email: `e2e.propose.${crypto.randomUUID()}@example.com`,
        name: 'Chefe Proposta',
      },
    });
    if (login.status() === 404) {
      test.skip(true, 'E2E session helper is disabled (production)');
    }
    expect(login.ok()).toBeTruthy();

    const name = `Proposta E2E ${Date.now()}`;
    try {
      const created = await page.request.post('/api/activities', {
        data: {
          name,
          description: 'Proposta de teste',
          materials: 'Nada',
          instructions: 'Passo 1\nPasso 2',
          approximate_duration_minutes: 15,
          group_sizes: ['small'],
          effort_level: 'low',
          locations: ['outside'],
          age_groups: ['scouts'],
          activity_type_ids: [typeId],
        },
      });
      expect(created.status()).toBe(201);
      const activity = (await created.json()) as { activity: { id: string } };
      await page.request.delete('/api/e2e/session');

      const guest = await page.request.get(`/api/activities/${activity.activity.id}`);
      expect(guest.status()).toBe(404);

      const admin = await page.request.post('/api/e2e/session', {
        data: {
          email: `e2e.admin.${crypto.randomUUID()}@example.com`,
          name: 'Chefe Admin',
          role: 'admin',
        },
      });
      expect(admin.ok()).toBeTruthy();
      const approved = await page.request.patch(`/api/admin/activities/${activity.activity.id}`, {
        data: { is_approved: true },
      });
      expect(approved.ok()).toBeTruthy();
      await page.request.delete('/api/e2e/session');

      const published = await page.request.get(`/api/activities/${activity.activity.id}`);
      expect(published.ok()).toBeTruthy();
      const detail = (await published.json()) as { instructions: string | null };
      expect(detail.instructions).toBe('Passo 1\nPasso 2');
    } finally {
      await page.request.delete('/api/e2e/session');
    }
  });
});

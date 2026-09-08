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

      let challengeId = (
        (await (await page.request.get('/api/taxonomies/challenges')).json()) as {
          challenges: { id: string }[];
        }
      ).challenges[0]?.id;

      if (!challengeId) {
        const createdType = await page.request.post('/api/admin/taxonomies/challenge-types', {
          data: { name: `Tipo desafio E2E ${Date.now()}` },
        });
        expect(createdType.status()).toBe(201);
        const typeJson = (await createdType.json()) as { item: { id: string } };
        const createdChallenge = await page.request.post('/api/admin/taxonomies/challenges', {
          data: {
            name: `Desafio E2E ${Date.now()}`,
            description: 'Desafio para criar atividade',
            type_id: typeJson.item.id,
          },
        });
        expect(createdChallenge.status()).toBe(201);
        challengeId = ((await createdChallenge.json()) as { item: { id: string } }).item.id;
      }

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
          challenge_ids: [challengeId],
        },
      });
      expect(created.status()).toBe(201);
      const activity = (await created.json()) as { activity: { id: string } };

      const detail = await page.request.get(`/api/activities/${activity.activity.id}`);
      expect(detail.ok()).toBeTruthy();
      const detailBody = (await detail.json()) as { challenges: { id: string }[] };
      expect(detailBody.challenges.some((item) => item.id === challengeId)).toBe(true);

      await page.goto('/admin/atividades/nova');
      await expect(page.getByText('Objetivos educativos')).toBeVisible();
      await expect(page.getByRole('group', { name: 'Desafios' })).toBeVisible();

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

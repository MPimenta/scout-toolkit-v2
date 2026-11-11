import { test, expect } from '@playwright/test';
import { formatAndFocus } from '../helpers/activity';

test.describe('Admin activities', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Admin E2E runs on desktop Chromium only');
  });

  test('shows activity instructions below the materials', async ({ page }) => {
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
      const refs = await formatAndFocus(page.request);

      const base = {
        description: 'Descrição E2E',
        materials: 'Nada',
        approximate_duration_minutes: 20,
        group_sizes: ['small'],
        effort_level: 'low',
        locations: ['outside'],
        age_groups: ['scouts'],
        ...refs,
      };
      const withInstructions = await page.request.post('/api/admin/activities', {
        data: { ...base, name: `E2E com instruções ${Date.now()}`, instructions: 'Passo 1\nPasso 2' },
      });
      expect(withInstructions.status()).toBe(201);
      const withoutInstructions = await page.request.post('/api/admin/activities', {
        data: { ...base, name: `E2E sem instruções ${Date.now()}` },
      });
      expect(withoutInstructions.status()).toBe(201);
      const withId = ((await withInstructions.json()) as { activity: { id: string } }).activity.id;
      const withoutId = ((await withoutInstructions.json()) as { activity: { id: string } }).activity.id;

      await page.goto(`/activities/${withId}`);
      // The suggestion form also lists a "Materiais" field, so look at the card titles only
      const materials = page.locator('[data-slot="card-title"]', { hasText: /^Materiais$/ });
      const instructions = page.locator('[data-slot="card-title"]', { hasText: /^Como se faz$/ });
      await expect(materials).toBeVisible();
      await expect(instructions).toBeVisible();
      await expect(page.getByText('Passo 1')).toBeVisible();
      const materialsBox = await materials.boundingBox();
      const instructionsBox = await instructions.boundingBox();
      expect(instructionsBox!.y).toBeGreaterThan(materialsBox!.y);

      await page.goto(`/activities/${withoutId}`);
      await expect(page.locator('[data-slot="card-title"]', { hasText: /^Materiais$/ })).toBeVisible();
      await expect(page.locator('[data-slot="card-title"]', { hasText: /^Como se faz$/ })).toHaveCount(0);
    } finally {
      await page.request.delete('/api/e2e/session');
    }
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
      const refs = await formatAndFocus(page.request);

      const name = `E2E atividade ${Date.now()}`;
      const created = await page.request.post('/api/admin/activities', {
        data: {
          name,
          description: 'Descrição E2E',
          materials: 'Nada',
          approximate_duration_minutes: 20,
          group_sizes: ['small'],
          effort_level: 'low',
          locations: ['outside'],
          age_groups: ['scouts'],
          ...refs,
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

  test('one activity can belong to several age groups and locations', async ({ page }) => {
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
      const refs = await formatAndFocus(page.request);

      const name = `E2E multi ${Date.now()}`;
      const created = await page.request.post('/api/admin/activities', {
        data: {
          name,
          description: 'Descrição E2E',
          materials: 'Nada',
          approximate_duration_minutes: 20,
          group_sizes: ['small', 'large'],
          effort_level: 'low',
          locations: ['inside', 'outside'],
          age_groups: ['cub_scouts', 'scouts'],
          ...refs,
        },
      });
      expect(created.status()).toBe(201);
      const id = ((await created.json()) as { activity: { id: string } }).activity.id;

      for (const group of ['cub_scouts', 'scouts']) {
        const listed = await page.request.get(
          `/api/activities?age_group=${group}&search=${encodeURIComponent(name)}`
        );
        const body = (await listed.json()) as { activities: { id: string }[] };
        expect(body.activities.filter((item) => item.id === id)).toHaveLength(1);
      }

      await page.goto(`/activities/${id}`);
      const divisions = page.getByRole('list', { name: 'Divisões' });
      await expect(divisions).toContainText('Lobitos');
      await expect(divisions).toContainText('Escoteiros');
      await expect(page.getByText('Interior, Exterior')).toBeVisible();
    } finally {
      await page.request.delete('/api/e2e/session');
    }
  });
});

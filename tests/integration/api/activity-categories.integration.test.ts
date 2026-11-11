import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { seedFormatAndFocus } from '../../helpers/reference-values';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/activities/route';
import { GET as GET_DETAIL } from '@/app/api/activities/[id]/route';
import { createActivity, parseActivityWrite, updateActivity } from '@/lib/activities/write';
import { loadActivityCategories } from '@/lib/activities/categories';
import { withTestDatabase, type TestDatabaseHandle } from '../../helpers/database';
import { insertActivities } from '../../helpers/activity-categories';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { activities } from '../../../drizzle/schema';

vi.mock('@/lib/auth/config', () => ({ auth: async () => null }));


const query = async (qs: string) => {
  const response = await GET(new NextRequest(`http://localhost:3000/api/activities?${qs}`));
  return { status: response.status, body: await response.json() };
};
const names = (body: { activities: { name: string }[] }) => body.activities.map((a) => a.name).sort();

describe('Activity categories (many-to-many)', () => {
  let db: TestDatabaseHandle['db'];
  let cleanup: () => Promise<void>;
  let multiId: string;
  let refs: Awaited<ReturnType<typeof seedFormatAndFocus>>;

  beforeAll(async () => {
    requireLocalTestDatabase();
    const setup = await withTestDatabase();
    db = setup.db;
    cleanup = setup.cleanup;
    await cleanup();

    refs = await seedFormatAndFocus(db);
    const base = { description: 'd', materials: 'm', approximate_duration_minutes: 30, effort_level: 'low' as const, is_approved: true };
    const rows = await insertActivities(db, [
      {
        ...base,
        name: 'Multi',
        group_sizes: ['small', 'large'],
        locations: ['inside', 'outside'],
        age_groups: ['cub_scouts', 'scouts'],
      },
      {
        ...base,
        name: 'So Rovers Fora',
        group_sizes: ['medium'],
        locations: ['outside'],
        age_groups: ['rovers'],
      },
    ]);
    multiId = rows[0]!.id;
  });

  afterAll(async () => {
    await cleanup();
  });

  describe('filters match any value', () => {
    it('finds the activity through any one of its age groups, once', async () => {
      for (const group of ['cub_scouts', 'scouts']) {
        const { body } = await query(`age_group=${group}`);
        expect(names(body)).toEqual(['Multi']);
        expect(body.pagination.total).toBe(1);
      }
    });

    it('does not duplicate rows when several selected values match', async () => {
      const { body } = await query('age_group=cub_scouts,scouts&location=inside,outside&group_size=small,large');
      expect(names(body)).toEqual(['Multi']);
      expect(body.pagination.total).toBe(1);
    });

    it('matches any selected value within a category', async () => {
      const { body } = await query('age_group=scouts,rovers');
      expect(names(body)).toEqual(['Multi', 'So Rovers Fora']);
    });

    it('combines different categories with AND', async () => {
      expect(names((await query('age_group=scouts&location=inside')).body)).toEqual(['Multi']);
      expect(names((await query('age_group=rovers&location=inside')).body)).toEqual([]);
    });

    it('ignores the removed activity_type parameter', async () => {
      const { status, body } = await query('activity_type=550e8400-e29b-41d4-a716-446655440701');
      expect(status).toBe(200);
      expect(names(body)).toEqual(['Multi', 'So Rovers Fora']);
    });

    it('accepts several locations', async () => {
      expect((await query('location=inside,outside')).body.pagination.total).toBe(2);
    });
  });

  describe('reads', () => {
    it('returns every category as an array in the list payload', async () => {
      const { body } = await query('age_group=scouts');
      const activity = body.activities[0];
      expect(activity.group_sizes).toEqual(['small', 'large']);
      expect(activity.locations).toEqual(['inside', 'outside']);
      expect(activity.age_groups).toEqual(['cub_scouts', 'scouts']);
      expect(activity).not.toHaveProperty('activity_types');
      expect(activity).not.toHaveProperty('group_size');
    });

    it('returns the same arrays from the detail endpoint', async () => {
      const response = await GET_DETAIL(
        new NextRequest(`http://localhost:3000/api/activities/${multiId}`),
        { params: Promise.resolve({ id: multiId }) }
      );
      const detail = await response.json();
      expect(detail.age_groups).toEqual(['cub_scouts', 'scouts']);
      expect(detail).not.toHaveProperty('activity_types');
    });
  });

  describe('writes', () => {
    const payload = (extra: Record<string, unknown> = {}) => ({
      name: 'Escrita',
      description: 'd',
      materials: 'm',
      approximate_duration_minutes: 20,
      group_sizes: ['small'],
      effort_level: 'low',
      locations: ['inside', 'outside'],
      age_groups: ['scouts', 'rovers'],
      ...refs,
      ...extra,
    });

    it('stores several values on create and replaces the whole set on update', async () => {
      const parsed = parseActivityWrite(payload());
      if (typeof parsed === 'string') throw new Error(parsed);
      const created = await createActivity(parsed, { isApproved: true });

      let categories = (await loadActivityCategories([created.id])).get(created.id)!;
      expect(categories.locations).toEqual(['inside', 'outside']);
      expect(categories.age_groups).toEqual(['scouts', 'rovers']);

      const next = parseActivityWrite(payload({ locations: ['outside'] }));
      if (typeof next === 'string') throw new Error(next);
      await updateActivity(created.id, next);

      categories = (await loadActivityCategories([created.id])).get(created.id)!;
      expect(categories.locations).toEqual(['outside']);
    });

    it('rolls back the whole write when a relation fails', async () => {
      const parsed = parseActivityWrite(payload({ name: 'Nao Deve Existir', educational_goal_ids: ['550e8400-e29b-41d4-a716-4466554407ff'] }));
      if (typeof parsed === 'string') throw new Error(parsed);
      await expect(createActivity(parsed, { isApproved: true })).rejects.toThrow();
      const found = await db.select().from(activities).where(eq(activities.name, 'Nao Deve Existir'));
      expect(found).toHaveLength(0);
    });
  });
});

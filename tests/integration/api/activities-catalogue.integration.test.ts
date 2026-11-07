import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { insertActivities } from '../../helpers/activity-categories'
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/activities/route';
import { withTestDatabase, type TestDatabaseHandle } from '../../helpers/database';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { activitySdgs, activityTypes, sdgs } from '../../../drizzle/schema';

vi.mock('@/lib/auth/config', () => ({ auth: async () => null }));

const TYPE_ID = '550e8400-e29b-41d4-a716-446655440601';
const SDG_13 = '550e8400-e29b-41d4-a716-446655440613';
const SDG_4 = '550e8400-e29b-41d4-a716-446655440604';

const query = async (qs: string) => {
  const response = await GET(new NextRequest(`http://localhost:3000/api/activities?${qs}`));
  return { status: response.status, body: await response.json() };
};
const names = (body: { activities: { name: string }[] }) => body.activities.map((a) => a.name).sort();

describe('Activity catalogue search and filters', () => {
  let db: TestDatabaseHandle['db'];
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    requireLocalTestDatabase();
    const setup = await withTestDatabase();
    db = setup.db;
    cleanup = setup.cleanup;
    await cleanup();

    await db.insert(activityTypes).values({ id: TYPE_ID, name: 'Jogo' });
    await db.insert(sdgs).values([
      { id: SDG_13, number: 13, name: 'Ação Climática', description: 'Clima', icon_url: '/sdg-13.png' },
      { id: SDG_4, number: 4, name: 'Educação de Qualidade', description: 'Educação', icon_url: '/sdg-4.png' },
    ]);

    const base = {
      description: 'Uma atividade',
      materials: 'Papel',
      group_sizes: ['medium' as const],
      effort_level: 'low' as const,
      locations: ['inside' as const],
      age_groups: ['scouts' as const],
      activity_type_id: TYPE_ID,
      is_approved: true,
    };
    const rows = Array.from({ length: 30 }, (_, i) => ({
      ...base,
      name: `Atividade ${String(i + 1).padStart(2, '0')}`,
      approximate_duration_minutes: 10 + i * 2, // 10..68
    }));
    rows[0] = { ...rows[0]!, name: 'Jogo do Fogo' };
    rows[1] = { ...rows[1]!, materials: 'Cordas e mosquetões' };
    rows[2] = { ...rows[2]!, name: 'Taxa 50% reduzida' };
    rows[3] = { ...rows[3]!, name: 'Taxa 500 reduzida' };
    const inserted = await insertActivities(db, rows);

    // 5 activities on SDG 13 spread across what would be different pages (indexes 4, 9, 14, 24, 29).
    await db.insert(activitySdgs).values(
      [4, 9, 14, 24, 29].map((i) => ({ activity_id: inserted[i]!.id, sdg_id: SDG_13 }))
    );
    await db.insert(activitySdgs).values({ activity_id: inserted[5]!.id, sdg_id: SDG_4 });
  });

  afterAll(async () => {
    await cleanup();
  });

  describe('search', () => {
    it('finds a word in the middle of a name', async () => {
      const { body } = await query('search=fogo');
      expect(names(body)).toEqual(['Jogo do Fogo']);
    });

    it('finds text in the materials, ignoring case', async () => {
      const { body } = await query('search=CORDAS');
      expect(body.activities).toHaveLength(1);
    });

    it('treats % as a literal character', async () => {
      const { body } = await query(`search=${encodeURIComponent('50%')}`);
      expect(names(body)).toEqual(['Taxa 50% reduzida']);
    });
  });

  describe('filters before pagination', () => {
    it('counts and pages SDG matches correctly', async () => {
      const { body } = await query(`sdgs=${SDG_13}&limit=20&page=1`);
      expect(body.pagination.total).toBe(5);
      expect(body.activities).toHaveLength(5);
    });

    it('keeps pages full for a broad filter', async () => {
      const page1 = await query('limit=20&page=1');
      const page2 = await query('limit=20&page=2');
      expect(page1.body.pagination.total).toBe(30);
      expect(page1.body.activities).toHaveLength(20);
      expect(page2.body.activities).toHaveLength(10);
    });
  });

  describe('duration', () => {
    it('applies a single lower bound, inclusive', async () => {
      const { status, body } = await query('duration_min=30&limit=100');
      expect(status).toBe(200);
      expect(body.activities.every((a: { approximate_duration_minutes: number }) => a.approximate_duration_minutes >= 30)).toBe(true);
      expect(body.pagination.total).toBe(20); // 30..68 step 2
    });

    it('applies a min-max range', async () => {
      const { body } = await query('duration_min=20&duration_max=24&limit=100');
      expect(body.activities.map((a: { approximate_duration_minutes: number }) => a.approximate_duration_minutes).sort()).toEqual([20, 22, 24]);
    });
  });

  describe('duration bounds', () => {
    it('applies a single upper bound, inclusive', async () => {
      const { body } = await query('duration_max=14&limit=100');
      expect(body.activities.map((a: { approximate_duration_minutes: number }) => a.approximate_duration_minutes).sort((x: number, y: number) => x - y)).toEqual([10, 12, 14]);
    });

    it('ignores the deprecated operator', async () => {
      const withOperator = await query('duration_min=30&duration_operator=%3E&limit=100');
      expect(withOperator.status).toBe(200);
      expect(withOperator.body.pagination.total).toBe(20); // 30 is still included
      const unknown = await query('duration_min=30&duration_operator=!%3D&limit=100');
      expect(unknown.status).toBe(200);
      expect(unknown.body.pagination.total).toBe(20);
    });
  });

  it('caps a very large limit at 100 instead of rejecting it', async () => {
    const { status, body } = await query('limit=1000');
    expect(status).toBe(200);
    expect(body.pagination.limit).toBe(100);
  });

  describe('invalid input', () => {
    it.each([
      ['an unknown group size', 'group_size=huge'],
      ['page 0', 'page=0'],
      ['a non-numeric duration', 'duration_min=abc'],
      ['a malformed SDG id', 'sdgs=13'],
    ])('rejects %s with 400', async (_label, qs) => {
      const { status, body } = await query(qs);
      expect(status).toBe(400);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});

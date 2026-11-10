import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { seedFormatAndFocus } from '../../helpers/reference-values';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { setupTestDatabase, teardownTestDatabase, resetTestDatabase } from '../../setup';
import { db } from '@/lib/db/server';
import {
  activityEducationalGoals,
  activityTypes,
  educationalAreas,
  educationalGoals,
  generalObjectives,
} from '../../../drizzle/schema';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { applyProgressMatrix } from '@/lib/reference-data/progress-matrix';
import { createActivity, parseActivityWrite } from '@/lib/activities/write';
import { GET } from '@/app/api/activities/route';

vi.mock('@/lib/auth/config', () => ({ auth: async () => null }));

const query = async (qs: string) => {
  const response = await GET(new NextRequest(`http://localhost:3000/api/activities?${qs}`));
  return { status: response.status, body: await response.json() };
};
const names = (body: { activities: { name: string }[] }) => body.activities.map((a) => a.name).sort();

describe('Catalogue objective filters (areas, general objectives, objectives)', () => {
  let physicalArea: string;
  let socialArea: string;
  let general4F: string;
  let goal4F32: string;
  let goal4S12: string;

  async function id<T extends { id: string }>(rows: Promise<T[]>): Promise<string> {
    return (await rows)[0]!.id;
  }

  beforeAll(async () => {
    requireLocalTestDatabase();
    await setupTestDatabase();
    await resetTestDatabase();
    await applyProgressMatrix(db);
    const refs = await seedFormatAndFocus(db);

    physicalArea = await id(db.select({ id: educationalAreas.id }).from(educationalAreas).where(eq(educationalAreas.code, 'F')));
    socialArea = await id(db.select({ id: educationalAreas.id }).from(educationalAreas).where(eq(educationalAreas.code, 'S')));
    general4F = await id(db.select({ id: generalObjectives.id }).from(generalObjectives).where(eq(generalObjectives.code, '4F')));
    goal4F32 = await id(db.select({ id: educationalGoals.id }).from(educationalGoals).where(eq(educationalGoals.code, '4F.3.2')));
    goal4S12 = await id(db.select({ id: educationalGoals.id }).from(educationalGoals).where(eq(educationalGoals.code, '4S.1.2')));
    const goal5F2 = await id(db.select({ id: educationalGoals.id }).from(educationalGoals).where(eq(educationalGoals.code, '5F.2')));
    const goal1A2 = await id(db.select({ id: educationalGoals.id }).from(educationalGoals).where(eq(educationalGoals.code, '1A.2')));
    const [type] = await db.insert(activityTypes).values({ name: 'Jogo' }).returning({ id: activityTypes.id });

    const make = async (name: string, minutes: number, goals: string[]) => {
      const parsed = parseActivityWrite({
        name,
        description: 'd',
        materials: 'm',
        approximate_duration_minutes: minutes,
        group_sizes: ['medium'],
        effort_level: 'low',
        locations: ['inside'],
        age_groups: ['scouts'],
        activity_type_ids: [type!.id],
        ...refs,
      });
      if (typeof parsed === 'string') throw new Error(parsed);
      const activity = await createActivity(parsed, { isApproved: true });
      // two rows for the same objective must still count the activity once
      for (const goal_id of goals) {
        await db.insert(activityEducationalGoals).values({ activity_id: activity.id, goal_id, age_group: 'scouts' });
      }
      return activity;
    };
    await make('Corpo e saúde', 10, [goal4F32, goal5F2]);
    await make('Equipas', 20, [goal4S12]);
    await make('Emoções', 30, [goal1A2]);
    await make('Sem objetivos', 40, []);
    // an activity that is linked to the same area twice and to the same objective for two divisions
    const twice = await make('Dupla ligação', 50, [goal4F32]);
    await db.insert(activityEducationalGoals).values({ activity_id: twice.id, goal_id: goal4F32, age_group: 'adventurers' });
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  it('matches activities linked to any objective of an area, once each', async () => {
    const { status, body } = await query(`educational_areas=${physicalArea}&limit=100`);
    expect(status).toBe(200);
    expect(names(body)).toEqual(['Corpo e saúde', 'Dupla ligação']);
    expect(body.pagination.total).toBe(2);
  });

  it('matches activities under a general objective', async () => {
    const { body } = await query(`general_objectives=${general4F}&limit=100`);
    expect(names(body)).toEqual(['Corpo e saúde', 'Dupla ligação']);
  });

  it('matches a specific objective', async () => {
    const { body } = await query(`educational_goals=${goal4S12}&limit=100`);
    expect(names(body)).toEqual(['Equipas']);
  });

  it('combines area, general objective and objective with OR', async () => {
    const { body } = await query(`educational_areas=${physicalArea}&educational_goals=${goal4S12}&limit=100`);
    expect(names(body)).toEqual(['Corpo e saúde', 'Dupla ligação', 'Equipas']);
    const area = await query(`educational_areas=${socialArea},${physicalArea}&limit=100`);
    expect(names(area.body)).toEqual(['Corpo e saúde', 'Dupla ligação', 'Equipas']);
  });

  it('combines the objective filters with the duration range by AND', async () => {
    const { body } = await query(`educational_areas=${physicalArea}&duration_min=11&duration_max=60&limit=100`);
    expect(names(body)).toEqual(['Dupla ligação']);
  });

  it('rejects malformed ids with a Portuguese validation error', async () => {
    for (const qs of ['educational_areas=F', 'general_objectives=4F', 'educational_goals=1']) {
      const { status, body } = await query(qs);
      expect(status).toBe(400);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    }
  });
});

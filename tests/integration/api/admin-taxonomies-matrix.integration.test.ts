import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { setupTestDatabase, teardownTestDatabase, resetTestDatabase } from '../../setup';
import { db } from '@/lib/db/server';
import { educationalGoalAgeGroups, educationalGoals, educationalAreas, generalObjectives } from '../../../drizzle/schema';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { applyProgressMatrix } from '@/lib/reference-data/progress-matrix';

vi.mock('@/lib/auth/utils', () => ({
  requireAdminApi: async () => ({ user: { id: 'admin-1', role: 'admin' } }),
}));

type Handler = (request: NextRequest, ctx: { params: Promise<{ kind: string }> }) => Promise<Response>;

async function call(method: 'POST' | 'PATCH' | 'DELETE', kind: string, body?: unknown, query = '') {
  const route = await import('@/app/api/admin/taxonomies/[kind]/route');
  const handler = route[method] as Handler;
  const request = new NextRequest(`http://localhost/api/admin/taxonomies/${kind}${query}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return handler(request, { params: Promise.resolve({ kind }) });
}

async function ids() {
  const [area] = await db.select().from(educationalAreas).where(eq(educationalAreas.code, 'F'));
  const [other] = await db.select().from(educationalAreas).where(eq(educationalAreas.code, 'S'));
  const [general] = await db.select().from(generalObjectives).where(eq(generalObjectives.code, '1F'));
  const [managedGoal] = await db.select().from(educationalGoals).where(eq(educationalGoals.code, '1F.1'));
  return { area: area!, other: other!, general: general!, managedGoal: managedGoal! };
}

describe('Admin taxonomies with the Matriz (DB)', () => {
  beforeAll(async () => {
    requireLocalTestDatabase();
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
    await applyProgressMatrix(db);
  });

  it('answers 409 when updating or deleting a managed objective', async () => {
    const { managedGoal } = await ids();
    expect((await call('PATCH', 'educational-goals', { id: managedGoal.id, title: 'Outro' })).status).toBe(409);
    expect((await call('DELETE', 'educational-goals', undefined, `?id=${managedGoal.id}`)).status).toBe(409);
    const [row] = await db.select().from(educationalGoals).where(eq(educationalGoals.id, managedGoal.id));
    expect(row?.title).toBe(managedGoal.title);
  });

  it('answers 409 when updating or deleting a managed area or general objective', async () => {
    const { area, general } = await ids();
    expect((await call('PATCH', 'educational-areas', { id: area.id, name: 'X' })).status).toBe(409);
    expect((await call('DELETE', 'educational-areas', undefined, `?id=${area.id}`)).status).toBe(409);
    expect((await call('PATCH', 'general-objectives', { id: general.id, title: 'X' })).status).toBe(409);
    expect((await call('DELETE', 'general-objectives', undefined, `?id=${general.id}`)).status).toBe(409);
  });

  it('creates an unmanaged goal with its age groups', async () => {
    const { area, general } = await ids();
    const response = await call('POST', 'educational-goals', {
      area_id: area.id,
      general_objective_id: general.id,
      title: 'Objetivo extra',
      code: 'EXTRA.1',
      age_groups: ['scouts', 'adventurers'],
      is_managed: true,
    });
    expect(response.status).toBe(201);
    const [row] = await db.select().from(educationalGoals).where(eq(educationalGoals.code, 'EXTRA.1'));
    expect(row?.is_managed).toBe(false);
    const links = await db.select().from(educationalGoalAgeGroups).where(eq(educationalGoalAgeGroups.goal_id, row!.id));
    expect(links.map((l) => l.age_group).sort()).toEqual(['adventurers', 'scouts']);

    // Unmanaged rows stay editable and deletable.
    expect((await call('PATCH', 'educational-goals', { id: row!.id, title: 'Revisto' })).status).toBe(200);
    expect((await call('DELETE', 'educational-goals', undefined, `?id=${row!.id}`)).status).toBe(200);
  });

  it('rejects a goal whose area differs from its general objective, or without age groups', async () => {
    const { other, general, area } = await ids();
    const mismatch = await call('POST', 'educational-goals', {
      area_id: other.id,
      general_objective_id: general.id,
      title: 'x',
      code: 'EXTRA.2',
      age_groups: ['scouts'],
    });
    expect(mismatch.status).toBe(400);

    const noAges = await call('POST', 'educational-goals', {
      area_id: area.id,
      general_objective_id: general.id,
      title: 'x',
      code: 'EXTRA.3',
      age_groups: [],
    });
    expect(noAges.status).toBe(400);
    expect(await db.select().from(educationalGoals).where(eq(educationalGoals.code, 'EXTRA.2'))).toHaveLength(0);
  });

  it('refuses to delete an admin general objective that still has goals', async () => {
    const { area } = await ids();
    const created = await call('POST', 'general-objectives', { area_id: area.id, code: 'GO.X', title: 'Geral extra' });
    expect(created.status).toBe(201);
    const { item } = (await created.json()) as { item: { id: string } };
    await call('POST', 'educational-goals', {
      area_id: area.id,
      general_objective_id: item.id,
      title: 'Filho',
      code: 'GO.X.1',
      age_groups: ['scouts'],
    });
    expect((await call('DELETE', 'general-objectives', undefined, `?id=${item.id}`)).status).toBe(409);
  });
});

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { withTestDatabase } from '../../helpers/database';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { resetTestDatabase } from '../../setup';
import {
  activityChallenges,
  activityTypes,
  activities,
  challengeTypes,
  challenges,
  user,
} from '../../../drizzle/schema';
import { GET as getChallengeTypes } from '@/app/api/taxonomies/challenge-types/route';
import { GET as getChallenges } from '@/app/api/taxonomies/challenges/route';
import { GET as getActivities } from '@/app/api/activities/route';
import { GET as getActivity } from '@/app/api/activities/[id]/route';
import { POST as postAdminTaxonomy, DELETE as deleteAdminTaxonomy } from '@/app/api/admin/taxonomies/[kind]/route';
import { POST as postAdminActivity } from '@/app/api/admin/activities/route';
import { seedChallengeTypes, CHALLENGE_TYPE_NAMES, SEEDED_CHALLENGES } from '../../../drizzle/seeds/challenge-types';
import { seedDemoActivities } from '../../../drizzle/seeds/demo-activities';

const mockAuth = vi.fn();

vi.mock('@/lib/auth/config', () => ({
  auth: () => mockAuth(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => undefined,
  }),
}));

const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440030';
const MEMBER_ID = '550e8400-e29b-41d4-a716-446655440031';

function jsonRequest(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('Activity challenges', () => {
  let db: Awaited<ReturnType<typeof withTestDatabase>>['db'];
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    requireLocalTestDatabase();
    const setup = await withTestDatabase();
    db = setup.db;
    cleanup = setup.cleanup;
  });

  afterAll(async () => {
    if (cleanup) await cleanup();
  });

  beforeEach(async () => {
    mockAuth.mockResolvedValue(null);
    await resetTestDatabase();
    await db.insert(user).values([
      { id: ADMIN_ID, email: 'admin-challenges@escoteiros.pt', name: 'Admin', role: 'admin' },
      { id: MEMBER_ID, email: 'member-challenges@escoteiros.pt', name: 'Membro', role: 'user' },
    ]);
  });

  it('lets a guest list challenge types and challenges with type id and name', async () => {
    const [type] = await db.insert(challengeTypes).values({ name: 'Técnicas Úteis' }).returning();
    await db.insert(challenges).values({
      name: 'Completar 5 nós',
      description: 'Lista de 10 nós; basta completar 5',
      type_id: type.id,
    });

    const typesResponse = await getChallengeTypes();
    expect(typesResponse.status).toBe(200);
    const typesBody = await typesResponse.json();
    expect(typesBody.challenge_types).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: type.id, name: 'Técnicas Úteis' })])
    );

    const challengesResponse = await getChallenges();
    expect(challengesResponse.status).toBe(200);
    const challengesBody = await challengesResponse.json();
    expect(challengesBody.challenges).toEqual([
      expect.objectContaining({
        name: 'Completar 5 nós',
        description: 'Lista de 10 nós; basta completar 5',
        type: { id: type.id, name: 'Técnicas Úteis' },
      }),
    ]);
  });

  it('rejects non-admins and unknown type_id, and blocks delete while in use', async () => {
    mockAuth.mockResolvedValue({
      user: { id: MEMBER_ID, role: 'user', email: 'member-challenges@escoteiros.pt', name: 'Membro' },
    });
    const forbidden = await postAdminTaxonomy(
      jsonRequest('http://localhost/api/admin/taxonomies/challenges', 'POST', {
        name: 'Novo desafio',
        description: 'Desc',
        type_id: '550e8400-e29b-41d4-a716-446655440099',
      }),
      { params: Promise.resolve({ kind: 'challenges' }) }
    );
    expect(forbidden.status).toBe(403);

    mockAuth.mockResolvedValue({
      user: { id: ADMIN_ID, role: 'admin', email: 'admin-challenges@escoteiros.pt', name: 'Admin' },
    });
    const unknownType = await postAdminTaxonomy(
      jsonRequest('http://localhost/api/admin/taxonomies/challenges', 'POST', {
        name: 'Novo desafio',
        description: 'Desc',
        type_id: '550e8400-e29b-41d4-a716-446655440099',
      }),
      { params: Promise.resolve({ kind: 'challenges' }) }
    );
    expect(unknownType.status).toBe(400);

    const typeResponse = await postAdminTaxonomy(
      jsonRequest('http://localhost/api/admin/taxonomies/challenge-types', 'POST', {
        name: 'Técnicas Úteis',
      }),
      { params: Promise.resolve({ kind: 'challenge-types' }) }
    );
    expect(typeResponse.status).toBe(201);
    const createdType = await typeResponse.json();

    const duplicate = await postAdminTaxonomy(
      jsonRequest('http://localhost/api/admin/taxonomies/challenge-types', 'POST', {
        name: 'Técnicas Úteis',
      }),
      { params: Promise.resolve({ kind: 'challenge-types' }) }
    );
    expect(duplicate.status).toBe(409);

    const challengeResponse = await postAdminTaxonomy(
      jsonRequest('http://localhost/api/admin/taxonomies/challenges', 'POST', {
        name: 'Completar 5 nós',
        description: 'Lista de 10 nós; basta completar 5',
        type_id: createdType.item.id,
      }),
      { params: Promise.resolve({ kind: 'challenges' }) }
    );
    expect(challengeResponse.status).toBe(201);
    const createdChallenge = await challengeResponse.json();

    const [activityType] = await db.insert(activityTypes).values({ name: 'Técnica', description: 'x' }).returning();
    const [activity] = await db.insert(activities).values({
      name: 'Construção de Abrigo',
      description: 'Abrigo',
      materials: 'Cordas',
      approximate_duration_minutes: 90,
      group_size: 'medium',
      effort_level: 'high',
      location: 'outside',
      age_group: 'rovers',
      activity_type_id: activityType.id,
      is_approved: true,
    }).returning();
    await db.insert(activityChallenges).values({
      activity_id: activity.id,
      challenge_id: createdChallenge.item.id,
    });

    const deleteChallenge = await deleteAdminTaxonomy(
      new NextRequest(`http://localhost/api/admin/taxonomies/challenges?id=${createdChallenge.item.id}`),
      { params: Promise.resolve({ kind: 'challenges' }) }
    );
    expect(deleteChallenge.status).toBe(409);

    const deleteType = await deleteAdminTaxonomy(
      new NextRequest(`http://localhost/api/admin/taxonomies/challenge-types?id=${createdType.item.id}`),
      { params: Promise.resolve({ kind: 'challenge-types' }) }
    );
    expect(deleteType.status).toBe(409);
  });

  it('stores challenges on create, rejects unknown ids, and filters any-of', async () => {
    const [type] = await db.insert(challengeTypes).values({ name: 'Técnicas Úteis' }).returning();
    const [outdoor] = await db.insert(challengeTypes).values({ name: 'Vida ao Ar Livre' }).returning();
    const [challengeX] = await db.insert(challenges).values({
      name: 'Completar 5 nós',
      description: 'Lista de 10 nós; basta completar 5',
      type_id: type.id,
    }).returning();
    const [challengeY] = await db.insert(challenges).values({
      name: 'Montar um abrigo simples',
      description: 'Abrigo com materiais naturais; proteção ao vento e chuva leve chega',
      type_id: outdoor.id,
    }).returning();
    const [activityType] = await db.insert(activityTypes).values({ name: 'Técnica', description: 'x' }).returning();

    mockAuth.mockResolvedValue({
      user: { id: ADMIN_ID, role: 'admin', email: 'admin-challenges@escoteiros.pt', name: 'Admin' },
    });

    const unknown = await postAdminActivity(
      jsonRequest('http://localhost/api/admin/activities', 'POST', {
        name: 'Atividade inválida',
        description: 'Desc',
        materials: 'Nada',
        approximate_duration_minutes: 20,
        group_size: 'small',
        effort_level: 'low',
        location: 'outside',
        age_group: 'scouts',
        activity_type_id: activityType.id,
        challenge_ids: ['550e8400-e29b-41d4-a716-446655440099'],
      })
    );
    expect(unknown.status).toBe(400);

    const createdA = await postAdminActivity(
      jsonRequest('http://localhost/api/admin/activities', 'POST', {
        name: 'Atividade A',
        description: 'Desc A',
        materials: 'Nada',
        approximate_duration_minutes: 20,
        group_size: 'small',
        effort_level: 'low',
        location: 'outside',
        age_group: 'scouts',
        activity_type_id: activityType.id,
        challenge_ids: [challengeX.id],
      })
    );
    expect(createdA.status).toBe(201);
    const activityA = await createdA.json();

    const createdB = await postAdminActivity(
      jsonRequest('http://localhost/api/admin/activities', 'POST', {
        name: 'Atividade B',
        description: 'Desc B',
        materials: 'Nada',
        approximate_duration_minutes: 20,
        group_size: 'small',
        effort_level: 'low',
        location: 'outside',
        age_group: 'scouts',
        activity_type_id: activityType.id,
        challenge_ids: [challengeY.id],
      })
    );
    expect(createdB.status).toBe(201);
    const activityB = await createdB.json();

    const empty = await postAdminActivity(
      jsonRequest('http://localhost/api/admin/activities', 'POST', {
        name: 'Atividade vazia',
        description: 'Desc',
        materials: 'Nada',
        approximate_duration_minutes: 20,
        group_size: 'small',
        effort_level: 'low',
        location: 'outside',
        age_group: 'scouts',
        activity_type_id: activityType.id,
        challenge_ids: [],
      })
    );
    expect(empty.status).toBe(201);
    const emptyActivity = await empty.json();

    mockAuth.mockResolvedValue(null);

    const detail = await getActivity(new NextRequest(`http://localhost/api/activities/${activityA.activity.id}`), {
      params: Promise.resolve({ id: activityA.activity.id }),
    });
    expect(detail.status).toBe(200);
    const detailBody = await detail.json();
    expect(detailBody.challenges).toEqual([
      expect.objectContaining({
        id: challengeX.id,
        name: 'Completar 5 nós',
        description: 'Lista de 10 nós; basta completar 5',
        type: expect.objectContaining({ name: 'Técnicas Úteis' }),
      }),
    ]);

    const emptyDetail = await getActivity(
      new NextRequest(`http://localhost/api/activities/${emptyActivity.activity.id}`),
      { params: Promise.resolve({ id: emptyActivity.activity.id }) }
    );
    const emptyBody = await emptyDetail.json();
    expect(emptyBody.challenges).toEqual([]);

    const filteredX = await getActivities(
      new NextRequest(`http://localhost/api/activities?challenges=${challengeX.id}`)
    );
    const filteredXBody = await filteredX.json();
    expect(filteredXBody.activities.map((item: { id: string }) => item.id)).toEqual([activityA.activity.id]);

    const filteredAny = await getActivities(
      new NextRequest(`http://localhost/api/activities?challenges=${challengeX.id},${challengeY.id}`)
    );
    const filteredAnyBody = await filteredAny.json();
    expect(filteredAnyBody.activities.map((item: { id: string }) => item.id).sort()).toEqual(
      [activityA.activity.id, activityB.activity.id].sort()
    );
  });

  it('upserts seven types and ten challenges without duplicating on re-seed', async () => {
    await seedChallengeTypes();
    await seedChallengeTypes();

    const types = await db.select().from(challengeTypes);
    expect(types.map((row) => row.name).sort()).toEqual([...CHALLENGE_TYPE_NAMES].sort());
    expect(types).toHaveLength(7);

    const rows = await db.select().from(challenges);
    expect(rows.map((row) => row.name).sort()).toEqual(
      SEEDED_CHALLENGES.map((challenge) => challenge.name).sort()
    );
    expect(rows).toHaveLength(10);
    expect(new Set(rows.map((row) => row.type_id)).size).toBeGreaterThan(1);

    await db.insert(activityTypes).values({ name: 'Técnica', description: 'Técnica' });
    await seedDemoActivities();
    await seedDemoActivities();

    const [shelter] = await db.select().from(activities).where(eq(activities.name, 'Construção de Abrigo'));
    expect(shelter).toBeDefined();
    const links = await db
      .select({ challenge_id: activityChallenges.challenge_id })
      .from(activityChallenges)
      .where(eq(activityChallenges.activity_id, shelter.id));
    expect(links).toHaveLength(2);

    const linked = await db
      .select({ name: challenges.name, type: challengeTypes.name })
      .from(activityChallenges)
      .innerJoin(challenges, eq(activityChallenges.challenge_id, challenges.id))
      .innerJoin(challengeTypes, eq(challenges.type_id, challengeTypes.id))
      .where(eq(activityChallenges.activity_id, shelter.id));
    expect(linked).toEqual(
      expect.arrayContaining([
        { name: 'Completar 5 nós', type: 'Técnicas Úteis' },
        { name: 'Montar um abrigo simples', type: 'Vida ao Ar Livre' },
      ])
    );
  });
});

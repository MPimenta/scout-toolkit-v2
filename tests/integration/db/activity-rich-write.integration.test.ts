import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { seedFormatAndFocus } from '../../helpers/reference-values';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { setupTestDatabase, teardownTestDatabase, resetTestDatabase } from '../../setup';
import { db } from '@/lib/db/server';
import {
  activityEducationalGoals,
  activitySources,
  activityTypes,
  challenges,
  educationalGoals,
  sdgs,
} from '../../../drizzle/schema';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { applyProgressMatrix } from '@/lib/reference-data/progress-matrix';
import { applyActivitySources } from '@/lib/reference-data/activity-sources';
import {
  createActivity,
  parseActivityWrite,
  verifyActivityExtras,
  verifyActivityGoals,
  type ActivityWrite,
} from '@/lib/activities/write';

vi.mock('@/lib/auth/config', () => ({ auth: async () => null }));

async function goalId(code: string): Promise<string> {
  const [row] = await db.select({ id: educationalGoals.id }).from(educationalGoals).where(eq(educationalGoals.code, code));
  return row!.id;
}

describe('rich activity writes (DB)', () => {
  let typeId: string;
  let refs: Awaited<ReturnType<typeof seedFormatAndFocus>>;
  let sdg3: string;
  let sdg17: string;

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
    await applyActivitySources(db);
    refs = await seedFormatAndFocus(db);
    [{ id: typeId }] = await db.insert(activityTypes).values({ name: 'Jogo' }).returning({ id: activityTypes.id }) as [{ id: string }];
    const rows = await db
      .insert(sdgs)
      .values([
        { number: 3, name: 'Saúde de Qualidade', description: 'd', icon_url: '/sdg-icons/sdg-3.png' },
        { number: 17, name: 'Parcerias', description: 'd', icon_url: '/sdg-icons/sdg-17.png' },
      ])
      .returning({ id: sdgs.id, number: sdgs.number });
    sdg3 = rows.find((row) => row.number === 3)!.id;
    sdg17 = rows.find((row) => row.number === 17)!.id;
  });

  function body(extra: Record<string, unknown>): Record<string, unknown> {
    return {
      name: 'Jogo da bandeira',
      description: 'Duas equipas defendem a sua bandeira.',
      materials: 'Cones',
      approximate_duration_minutes: 30,
      group_sizes: ['medium'],
      effort_level: 'low',
      locations: ['outside'],
      age_groups: ['scouts', 'adventurers'],
      activity_type_ids: [typeId],
      ...refs,
      ...extra,
    };
  }

  function parsed(extra: Record<string, unknown>): ActivityWrite {
    const result = parseActivityWrite(body(extra));
    if (typeof result === 'string') throw new Error(result);
    return result;
  }

  it('stores risks, per-division objectives with behaviours, SDG justifications, desafios and the source', async () => {
    const [source] = await db.select().from(activitySources).where(eq(activitySources.code, 'OSM'));
    const [challenge] = await db.select().from(challenges).where(eq(challenges.code, 'EVAS-B'));
    const shared = await goalId('4S.2.2-3');
    const data = parsed({
      physical_risk_level: 'medium',
      physical_risk: 'Quedas',
      physical_mitigation: 'Campo livre',
      psychological_risk_level: 'low',
      objectives: [
        { goal_id: shared, age_group: 'scouts', behaviour: 'Lidera a equipa' },
        { goal_id: shared, age_group: 'adventurers', behaviour: 'Coordena os papéis' },
      ],
      sdgs: [
        { sdg_id: sdg3, justification: 'Mantém o corpo ativo' },
        { sdg_id: sdg17 },
      ],
      challenge_ids: [challenge!.id],
      source_id: source!.id,
      source_url: 'https://example.com/jogo',
    });
    expect(await verifyActivityGoals(data)).toBeNull();
    expect(await verifyActivityExtras(data)).toBeNull();

    const activity = await createActivity(data, { isApproved: true });
    const { GET } = await import('@/app/api/activities/[id]/route');
    const response = await GET(new NextRequest(`http://localhost/api/activities/${activity.id}`), {
      params: Promise.resolve({ id: activity.id }),
    });
    const detail = await response.json();

    expect(detail.physical_risk_level).toBe('medium');
    expect(detail.physical_mitigation).toBe('Campo livre');
    expect(detail.psychological_risk_level).toBe('low');
    expect(detail.source).toMatchObject({ code: 'OSM', name: 'Online Scout Manager' });
    expect(detail.source_url).toBe('https://example.com/jogo');
    expect(detail.objectives.map((row: { age_group: string; behaviour: string }) => [row.age_group, row.behaviour]).sort()).toEqual([
      ['adventurers', 'Coordena os papéis'],
      ['scouts', 'Lidera a equipa'],
    ]);
    // The goal is listed once in the distinct list even though it is linked twice.
    expect(detail.educational_goals).toHaveLength(1);
    expect(detail.sdgs.find((sdg: { number: number }) => sdg.number === 3).justification).toBe('Mantém o corpo ativo');
    expect(detail.sdgs.find((sdg: { number: number }) => sdg.number === 17).justification).toBeNull();
    expect(detail.challenges).toEqual([expect.objectContaining({ code: 'EVAS-B', type_code: 'EVAS' })]);
  });

  it('rejects an objective that does not belong to its row division, naming its code', async () => {
    const error = await verifyActivityGoals(
      parsed({ objectives: [{ goal_id: await goalId('1A.1'), age_group: 'scouts' }] })
    );
    expect(error).toContain('1A.1');
  });

  it('has no objectives for Dirigentes: a leaders row is rejected even for a Clã objective', async () => {
    const roversGoal = await goalId('4A.4');
    const bad = parsed({
      age_groups: ['rovers', 'leaders'],
      objectives: [{ goal_id: roversGoal, age_group: 'leaders', behaviour: 'Dá o exemplo' }],
    });
    expect(await verifyActivityGoals(bad)).toContain('4A.4');
    // The same activity is fine with the objective on its Clã division only.
    const ok = parsed({ age_groups: ['rovers', 'leaders'], objectives: [{ goal_id: roversGoal, age_group: 'rovers' }] });
    expect(await verifyActivityGoals(ok)).toBeNull();
  });

  it('rejects a row for a division that is not on the activity', () => {
    const result = parseActivityWrite(
      body({ objectives: [{ goal_id: '00000000-0000-4000-8000-000000000001', age_group: 'rovers' }] })
    );
    expect(result).toBe('A divisão rovers não é uma das divisões da atividade');
  });

  it('expands the old educational_goal_ids shorthand to one row per shared division, without behaviour', async () => {
    const shared = await goalId('4S.2.2-3');
    const activity = await createActivity(parsed({ educational_goal_ids: [shared] }), { isApproved: true });
    const rows = await db.select().from(activityEducationalGoals).where(eq(activityEducationalGoals.activity_id, activity.id));
    expect(rows.map((row) => row.age_group).sort()).toEqual(['adventurers', 'scouts']);
    expect(rows.every((row) => row.observable_behaviour === null)).toBe(true);
  });

  it('lets explicit objectives win over the shorthand', async () => {
    const shared = await goalId('4S.2.2-3');
    const other = await goalId('5I.2');
    const activity = await createActivity(
      parsed({
        educational_goal_ids: [shared],
        objectives: [{ goal_id: other, age_group: 'scouts', behaviour: 'x' }],
      }),
      { isApproved: true }
    );
    const rows = await db.select().from(activityEducationalGoals).where(eq(activityEducationalGoals.activity_id, activity.id));
    expect(rows.map((row) => row.goal_id)).toEqual([other]);
  });

  it('rejects an invalid risk level, over-long text and an unknown desafio or source', async () => {
    expect(parseActivityWrite(body({ physical_risk_level: 'extreme' }))).toBe('Nível de risco inválido (físico)');
    expect(parseActivityWrite(body({ psychological_risk: 'x'.repeat(2001) }))).toContain('2000');
    expect(parseActivityWrite(body({ objectives: [{ goal_id: '00000000-0000-4000-8000-000000000001', age_group: 'scouts', behaviour: 'x'.repeat(1001) }] }))).toContain('1000');
    expect(parseActivityWrite(body({ sdgs: [{ sdg_id: sdg3, justification: 'x'.repeat(1001) }] }))).toContain('1000');
    expect(parseActivityWrite(body({ source_url: 'http://insecure.example.com' }))).toBe('A ligação à fonte deve usar HTTPS');

    const unknownChallenge = parsed({ challenge_ids: ['00000000-0000-4000-8000-000000000002'] });
    expect(await verifyActivityExtras(unknownChallenge)).toBe('Desafio inválido');
    const unknownSource = parsed({ source_id: '00000000-0000-4000-8000-000000000003' });
    expect(await verifyActivityExtras(unknownSource)).toBe('Fonte inválida');
  });

  it('keeps the old sdg_ids shorthand working without justifications', () => {
    const data = parsed({ sdg_ids: [sdg3, sdg17] });
    expect(data.sdgs).toEqual([
      { sdg_id: sdg3, justification: null },
      { sdg_id: sdg17, justification: null },
    ]);
  });

  it('loads the source catalogue idempotently', async () => {
    const [{ n }] = (await db.execute(`select count(*)::int as n from activity_sources` as never)) as unknown as Array<{ n: number }>;
    expect(n).toBe(36);
    expect(await applyActivitySources(db)).toBe(0);
  });
});

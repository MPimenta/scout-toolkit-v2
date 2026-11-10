import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { seedFormatAndFocus } from '../../helpers/reference-values';
import { eq } from 'drizzle-orm';
import { setupTestDatabase, teardownTestDatabase, resetTestDatabase } from '../../setup';
import { db } from '@/lib/db/server';
import { activities, activityTypes } from '../../../drizzle/schema';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { createActivity, parseActivityWrite } from '@/lib/activities/write';

describe('Activity instructions (DB)', () => {
  let activityTypeId: string;
  let refs: Awaited<ReturnType<typeof seedFormatAndFocus>>;

  beforeAll(async () => {
    requireLocalTestDatabase();
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
    const [type] = await db.insert(activityTypes).values({ name: 'Jogo' }).returning();
    activityTypeId = type.id;
    refs = await seedFormatAndFocus(db);
  });

  function payload(extra: Record<string, unknown> = {}) {
    return {
      name: 'Jogo da Bandeira',
      description: 'Jogo de perseguição',
      materials: 'Bandeiras',
      approximate_duration_minutes: 45,
      group_sizes: ['medium'],
      effort_level: 'high',
      locations: ['outside'],
      age_groups: ['scouts'],
      activity_type_ids: [activityTypeId],
      ...refs,
      ...extra,
    };
  }

  it('stores multi-line instructions exactly as written', async () => {
    const parsed = parseActivityWrite(payload({ instructions: '1. Formar equipas\n2. Jogar' }));
    expect(typeof parsed).not.toBe('string');
    const created = await createActivity(parsed as Exclude<typeof parsed, string>, { isApproved: true });

    const [row] = await db.select().from(activities).where(eq(activities.id, created.id));
    expect(row.instructions).toBe('1. Formar equipas\n2. Jogar');
  });

  it('stores null when instructions are omitted or blank', async () => {
    for (const extra of [{}, { instructions: '   ' }]) {
      const parsed = parseActivityWrite(payload(extra));
      const created = await createActivity(parsed as Exclude<typeof parsed, string>, { isApproved: true });
      const [row] = await db.select().from(activities).where(eq(activities.id, created.id));
      expect(row.instructions).toBeNull();
    }
  });
});

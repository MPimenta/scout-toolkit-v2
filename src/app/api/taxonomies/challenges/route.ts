import { NextRequest, NextResponse } from 'next/server';
import { and, asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/server';
import { challengeTypes, challenges } from '../../../../../drizzle/schema';
import { AGE_GROUP_VALUES } from '../../../../../drizzle/schema/category-values';
import { apiErrors, handleApiError } from '@/lib/errors';

const querySchema = z.object({ age_group: z.enum(AGE_GROUP_VALUES).optional() });

/** Matriz desafios grouped by type, optionally for one division. */
export async function GET(request: NextRequest) {
  try {
    const parsed = querySchema.safeParse({
      age_group: new URL(request.url).searchParams.get('age_group') ?? undefined,
    });
    if (!parsed.success) return apiErrors.validation('query', 'Filtros inválidos');

    const rows = await db
      .select({
        id: challenges.id,
        code: challenges.code,
        title: challenges.title,
        short_title: challenges.short_title,
        integration_age_groups: challenges.integration_age_groups,
        age_group: challenges.age_group,
        type: { code: challengeTypes.code, name: challengeTypes.name },
      })
      .from(challenges)
      .innerJoin(challengeTypes, eq(challenges.type_id, challengeTypes.id))
      .where(and(parsed.data.age_group ? eq(challenges.age_group, parsed.data.age_group) : undefined))
      .orderBy(asc(challengeTypes.position), asc(challenges.position));
    return NextResponse.json({ challenges: rows });
  } catch (error) {
    return handleApiError(error, 'Error fetching challenges:');
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/server';
import {
  educationalGoals,
  educationalAreas,
  educationalGoalAgeGroups,
  educationalPaths,
  generalObjectives,
} from '../../../../../drizzle/schema';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { AGE_GROUP_VALUES } from '../../../../../drizzle/schema/category-values';
import { apiErrors, handleApiError } from '@/lib/errors';

const querySchema = z.object({
  area_id: z.string().uuid().optional(),
  general_objective_id: z.string().uuid().optional(),
  age_group: z.array(z.enum(AGE_GROUP_VALUES)).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      area_id: searchParams.get('area_id') ?? undefined,
      general_objective_id: searchParams.get('general_objective_id') ?? undefined,
      age_group: searchParams.getAll('age_group').length ? searchParams.getAll('age_group') : undefined,
    });
    if (!parsed.success) {
      return apiErrors.validation('query', 'Filtros inválidos');
    }
    const { area_id: areaId, general_objective_id: generalObjectiveId, age_group: ageGroups } = parsed.data;

    const baseQuery = db
      .select({
        id: educationalGoals.id,
        title: educationalGoals.title,
        description: educationalGoals.description,
        code: educationalGoals.code,
        is_managed: educationalGoals.is_managed,
        general_objective: {
          id: generalObjectives.id,
          code: generalObjectives.code,
          title: generalObjectives.title,
          path: educationalPaths.name,
        },
        area: {
          id: educationalAreas.id,
          name: educationalAreas.name,
          icon: educationalAreas.icon,
          code: educationalAreas.code,
        },
      })
      .from(educationalGoals)
      .leftJoin(educationalAreas, eq(educationalGoals.area_id, educationalAreas.id))
      .leftJoin(generalObjectives, eq(educationalGoals.general_objective_id, generalObjectives.id))
      .leftJoin(educationalPaths, eq(generalObjectives.path_id, educationalPaths.id));

    const conditions = [
      areaId ? eq(educationalGoals.area_id, areaId) : undefined,
      generalObjectiveId ? eq(educationalGoals.general_objective_id, generalObjectiveId) : undefined,
      ageGroups?.length
        ? inArray(
            educationalGoals.id,
            db
              .select({ id: educationalGoalAgeGroups.goal_id })
              .from(educationalGoalAgeGroups)
              .where(inArray(educationalGoalAgeGroups.age_group, ageGroups))
          )
        : undefined,
    ].filter((condition) => condition !== undefined);

    const rows = await baseQuery
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(educationalAreas.position), asc(educationalGoals.position), asc(educationalGoals.code));

    const ageRows = rows.length
      ? await db
          .select()
          .from(educationalGoalAgeGroups)
          .where(inArray(educationalGoalAgeGroups.goal_id, rows.map((row) => row.id)))
      : [];
    const goals = rows.map((row) => ({
      ...row,
      age_groups: ageRows.filter((link) => link.goal_id === row.id).map((link) => link.age_group),
    }));

    return NextResponse.json({ educational_goals: goals });
  } catch (error) {
    return handleApiError(error, 'Error fetching educational goals:');
  }
}

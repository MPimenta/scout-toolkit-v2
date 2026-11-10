import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/server';
import {
  activities,
  activityChallenges,
  activitySources,
  challengeTypes,
  challenges,
  educationalGoals,
  generalObjectives,
  sdgs,
  activityEducationalGoals,
  activitySdgs,
  educationalAreas,
  user,
} from '../../../../../drizzle/schema';
import { asc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';
import { getEffectiveRole } from '@/lib/auth/view-as';
import { 
  apiErrors, 
  logApiRequest, 
  logApiResponse,
  withApiErrorHandler 
} from '@/lib/errors';
import { validateUUID } from '@/lib/errors/error-handler';
import { loadActivityCategoriesFor } from '@/lib/activities/categories';
import { loadGoalAgeGroups } from '@/lib/activities/goals';
import { loadFormatFocus } from '@/lib/activities/format-focus';
import { parseActivityWrite, updateActivity, verifyActivityExtras, verifyActivityGoals, verifyActivityTypes, verifyFormatAndFocus } from '@/lib/activities/write';

export const GET = withApiErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  logApiRequest('GET', '/api/activities/[id]');
  
  const { id } = await params;

  if (!id) {
    return apiErrors.validation('id', 'ID da atividade é obrigatório');
  }
  
  // Validate activity ID
  const uuidValidation = validateUUID(id);
  if (!uuidValidation.success) {
    return apiErrors.validation('id', 'ID da atividade inválido');
  }

    // Fetch the main activity data
    const activityData = await db
      .select({
        id: activities.id,
        name: activities.name,
        description: activities.description,
        materials: activities.materials,
        instructions: activities.instructions,
        approximate_duration_minutes: activities.approximate_duration_minutes,
        duration_min_minutes: activities.duration_min_minutes,
        duration_max_minutes: activities.duration_max_minutes,
        external_id: activities.external_id,
        format_id: activities.format_id,
        focus_id: activities.focus_id,
        secondary_focus_id: activities.secondary_focus_id,
        effort_level: activities.effort_level,
        image_url: activities.image_url,
        physical_risk_level: activities.physical_risk_level,
        physical_risk: activities.physical_risk,
        physical_mitigation: activities.physical_mitigation,
        psychological_risk_level: activities.psychological_risk_level,
        psychological_risk: activities.psychological_risk,
        psychological_mitigation: activities.psychological_mitigation,
        source_id: activities.source_id,
        source_url: activities.source_url,
        created_by: activities.created_by,
        is_approved: activities.is_approved,
        created_at: activities.created_at,
        updated_at: activities.updated_at,
        author_name: user.name,
      })
      .from(activities)
      .leftJoin(user, eq(activities.created_by, user.id))
      .where(eq(activities.id, id))
      .limit(1);

    if (activityData.length === 0) {
      return apiErrors.notFound('atividade', id);
    }

    const activity = activityData[0];
    if (!activity.is_approved) {
      const session = await auth();
      const isAuthor = session?.user?.id && session.user.id === activity.created_by;
      const isAdmin = (await getEffectiveRole(session?.user?.role)) === 'admin';
      if (!isAuthor && !isAdmin) {
        return apiErrors.notFound('atividade', id);
      }
    }

    // Fetch educational goals with their areas
    const goals = await db
      .select({
        id: educationalGoals.id,
        title: educationalGoals.title,
        description: educationalGoals.description,
        code: educationalGoals.code,
        area: {
          id: educationalAreas.id,
          name: educationalAreas.name,
          description: educationalAreas.description,
          icon: educationalAreas.icon,
          code: educationalAreas.code,
        },
      })
      .from(activityEducationalGoals)
      .leftJoin(educationalGoals, eq(activityEducationalGoals.goal_id, educationalGoals.id))
      .leftJoin(educationalAreas, eq(educationalGoals.area_id, educationalAreas.id))
      .where(eq(activityEducationalGoals.activity_id, id));

    // Distinct objectives (a goal linked for two divisions appears once here)
    const distinctGoals = goals.filter((goal, index) => goals.findIndex((other) => other.id === goal.id) === index);
    const goalAgeGroups = await loadGoalAgeGroups(distinctGoals.flatMap((g) => (g.id ? [g.id] : [])));

    // Objectives per division with the behaviour that shows each was reached
    const objectives = await db
      .select({
        goal_id: educationalGoals.id,
        code: educationalGoals.code,
        title: educationalGoals.title,
        age_group: activityEducationalGoals.age_group,
        behaviour: activityEducationalGoals.observable_behaviour,
        area_name: educationalAreas.name,
        general_objective_code: generalObjectives.code,
        general_objective_title: generalObjectives.title,
      })
      .from(activityEducationalGoals)
      .innerJoin(educationalGoals, eq(activityEducationalGoals.goal_id, educationalGoals.id))
      .leftJoin(educationalAreas, eq(educationalGoals.area_id, educationalAreas.id))
      .leftJoin(generalObjectives, eq(educationalGoals.general_objective_id, generalObjectives.id))
      .where(eq(activityEducationalGoals.activity_id, id))
      .orderBy(asc(educationalGoals.position), asc(educationalGoals.code));

    // Matriz desafios linked to the activity
    const linkedChallenges = await db
      .select({
        id: challenges.id,
        code: challenges.code,
        title: challenges.title,
        short_title: challenges.short_title,
        integration_age_groups: challenges.integration_age_groups,
        age_group: challenges.age_group,
        type_code: challengeTypes.code,
        type_name: challengeTypes.name,
      })
      .from(activityChallenges)
      .innerJoin(challenges, eq(activityChallenges.challenge_id, challenges.id))
      .innerJoin(challengeTypes, eq(challenges.type_id, challengeTypes.id))
      .where(eq(activityChallenges.activity_id, id))
      .orderBy(asc(challengeTypes.position), asc(challenges.position));

    const [source] = activity.source_id
      ? await db
          .select({ id: activitySources.id, code: activitySources.code, name: activitySources.name, url: activitySources.url, license: activitySources.license })
          .from(activitySources)
          .where(eq(activitySources.id, activity.source_id))
      : [];

    // Fetch SDGs
    const sdgData = await db
      .select({
        id: sdgs.id,
        number: sdgs.number,
        name: sdgs.name,
        description: sdgs.description,
        icon_url: sdgs.icon_url,
        justification: activitySdgs.justification,
      })
      .from(activitySdgs)
      .leftJoin(sdgs, eq(activitySdgs.sdg_id, sdgs.id))
      .where(eq(activitySdgs.activity_id, id));

    // Combine all data
    const categories = await loadActivityCategoriesFor(id);
    const formatFocus = (await loadFormatFocus([activity])).get(id)!;
    const activityWithDetails = {
      ...activity,
      ...categories,
      ...formatFocus,
      educational_goals: distinctGoals.map((goal) => ({ ...goal, age_groups: goal.id ? goalAgeGroups.get(goal.id) ?? [] : [] })),
      objectives,
      challenges: linkedChallenges,
      source: source ?? null,
      sdgs: sdgData,
    };

    const response = NextResponse.json(activityWithDetails);
    logApiResponse('GET', '/api/activities/[id]', 200);
    return response;
});

export const PATCH = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth();
  if (!session?.user?.id) return apiErrors.unauthorized();

  const { id } = await params;
  const [row] = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
  if (!row) return apiErrors.notFound('atividade', id);
  if (row.created_by !== session.user.id || row.is_approved) {
    return apiErrors.forbidden('Só pode editar a sua proposta enquanto estiver pendente');
  }

  const parsed = parseActivityWrite(await request.json());
  if (typeof parsed === 'string') return apiErrors.validation('body', parsed);

  const typeError = await verifyActivityTypes(parsed);
  if (typeError) return apiErrors.validation('body', typeError);

  const formatFocusError = await verifyFormatAndFocus(parsed);
  if (formatFocusError) return apiErrors.validation('body', formatFocusError);

  const goalError = await verifyActivityGoals(parsed);
  if (goalError) return apiErrors.validation('body', goalError);

  const extrasError = await verifyActivityExtras(parsed);
  if (extrasError) return apiErrors.validation('body', extrasError);

  const updated = await updateActivity(id, parsed);
  if (!updated) return apiErrors.notFound('atividade', id);
  return NextResponse.json({ activity: updated });
});

export const DELETE = withApiErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth();
  if (!session?.user?.id) return apiErrors.unauthorized();
  const { id } = await params;
  const [row] = await db.select().from(activities).where(eq(activities.id, id)).limit(1);
  if (!row) return apiErrors.notFound('atividade', id);
  if (row.created_by !== session.user.id || row.is_approved) {
    return apiErrors.forbidden('Só pode retirar a sua proposta enquanto estiver pendente');
  }
  await db.delete(activities).where(eq(activities.id, id));
  return NextResponse.json({ success: true });
});

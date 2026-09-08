import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/server';
import { activities, activityTypes, educationalGoals, sdgs, activityEducationalGoals, activitySdgs, educationalAreas, activityChallenges, challenges, challengeTypes, user } from '../../../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';
import { getEffectiveRole } from '@/lib/auth/view-as';
import { 
  apiErrors, 
  logApiRequest, 
  logApiResponse,
  withApiErrorHandler 
} from '@/lib/errors';
import { validateUUID } from '@/lib/errors/error-handler';
import { parseActivityWrite, replaceRelations, validateChallengeIds } from '@/lib/activities/write';

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
        approximate_duration_minutes: activities.approximate_duration_minutes,
        group_size: activities.group_size,
        effort_level: activities.effort_level,
        location: activities.location,
        age_group: activities.age_group,
        image_url: activities.image_url,
        created_by: activities.created_by,
        is_approved: activities.is_approved,
        created_at: activities.created_at,
        updated_at: activities.updated_at,
        author_name: user.name,
        activity_type: {
          id: activityTypes.id,
          name: activityTypes.name,
          description: activityTypes.description,
        },
      })
      .from(activities)
      .leftJoin(activityTypes, eq(activities.activity_type_id, activityTypes.id))
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

    const challengeData = await db
      .select({
        id: challenges.id,
        name: challenges.name,
        description: challenges.description,
        type: {
          id: challengeTypes.id,
          name: challengeTypes.name,
        },
      })
      .from(activityChallenges)
      .leftJoin(challenges, eq(activityChallenges.challenge_id, challenges.id))
      .leftJoin(challengeTypes, eq(challenges.type_id, challengeTypes.id))
      .where(eq(activityChallenges.activity_id, id));

    // Fetch SDGs
    const sdgData = await db
      .select({
        id: sdgs.id,
        number: sdgs.number,
        name: sdgs.name,
        description: sdgs.description,
        icon_url: sdgs.icon_url,
      })
      .from(activitySdgs)
      .leftJoin(sdgs, eq(activitySdgs.sdg_id, sdgs.id))
      .where(eq(activitySdgs.activity_id, id));

    // Combine all data
    const activityWithDetails = {
      ...activity,
      educational_goals: goals,
      challenges: challengeData,
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
  const challengeError = await validateChallengeIds(parsed.challenge_ids ?? []);
  if (challengeError) return apiErrors.validation('challenge_ids', challengeError);

  const [updated] = await db
    .update(activities)
    .set({
      name: parsed.name,
      description: parsed.description,
      materials: parsed.materials,
      approximate_duration_minutes: parsed.approximate_duration_minutes,
      group_size: parsed.group_size,
      effort_level: parsed.effort_level,
      location: parsed.location,
      age_group: parsed.age_group,
      activity_type_id: parsed.activity_type_id,
      image_url: parsed.image_url,
      updated_at: new Date(),
    })
    .where(eq(activities.id, id))
    .returning();
  await replaceRelations(id, parsed);
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

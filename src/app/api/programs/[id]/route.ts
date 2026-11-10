import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/server';
import { programs, programEntries, activities, user } from '../../../../../drizzle/schema';
import { eq, and, asc } from 'drizzle-orm';
import { 
  apiErrors, 
  logApiRequest, 
  logApiResponse,
  withApiErrorHandler 
} from '@/lib/errors';
import { validateUUID } from '@/lib/errors/error-handler';
import { isE2EOrgoStub, isOrgoWriteConfigured } from '@/lib/orgo/config';
import { z } from 'zod';
import { loadActivityCategories } from '@/lib/activities/categories';
import { loadFormatFocus } from '@/lib/activities/format-focus';
import { recalculateProgramSchedule } from '@/lib/programs/recalculate';
import { computeSchedule, timeToMinutes } from '@/lib/programs/schedule';
import { isOrgoPending } from '@/lib/orgo/claim';

export const GET = withApiErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  logApiRequest('GET', '/api/programs/[id]');
  
  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return apiErrors.unauthorized();
  }

  const { id: programId } = await params;
  
  // Validate program ID
  const uuidValidation = validateUUID(programId);
  if (!uuidValidation.success) {
    return apiErrors.validation('id', 'ID do programa inválido');
  }

    // Fetch program with user info - only show programs owned by the authenticated user
    const [programRow] = await db
      .select({
        id: programs.id,
        name: programs.name,
        date: programs.date,
        start_time: programs.start_time,
        is_public: programs.is_public,
        orgo_event_uuid: programs.orgo_event_uuid,
        orgo_event_url: programs.orgo_event_url,
        created_at: programs.created_at,
        updated_at: programs.updated_at,
        user_id: user.id,
        user_name: user.name,
      })
      .from(programs)
      .leftJoin(user, eq(programs.user_id, user.id))
      .where(and(eq(programs.id, programId), eq(programs.user_id, session.user.id)));

    if (!programRow) {
      return apiErrors.notFound('programa', programId);
    }

    const { user_id: _userId, user_name: _userName, ...programFields } = programRow;
    // While an Orgo event is being created the stored uuid is a claim marker, not an event.
    const orgoPending = isOrgoPending(programFields.orgo_event_uuid);
    const programData = {
      ...programFields,
      orgo_event_uuid: orgoPending ? null : programFields.orgo_event_uuid,
      orgo_event_url: orgoPending ? null : programFields.orgo_event_url,
      orgo_event_pending: orgoPending,
      orgo_write_configured: isOrgoWriteConfigured() || isE2EOrgoStub(session.user.email),
      user: {
        id: programRow.user_id ?? session.user.id,
        name: programRow.user_name ?? session.user.name ?? 'Utilizador',
      },
    };

    // Fetch program entries with activity details
    const entries = await db
      .select({
        id: programEntries.id,
        position: programEntries.position,
        start_time: programEntries.start_time,
        end_time: programEntries.end_time,
        entry_type: programEntries.entry_type,
        custom_title: programEntries.custom_title,
        custom_duration_minutes: programEntries.custom_duration_minutes,
        activity_id: activities.id,
        activity_name: activities.name,
        activity_duration: activities.approximate_duration_minutes,
        activity_effort_level: activities.effort_level,
        activity_format_id: activities.format_id,
        activity_focus_id: activities.focus_id,
        activity_secondary_focus_id: activities.secondary_focus_id,
      })
      .from(programEntries)
      .leftJoin(activities, eq(programEntries.activity_id, activities.id))
      .where(eq(programEntries.program_id, programId))
      .orderBy(asc(programEntries.position));

    const categoriesByActivity = await loadActivityCategories(
      entries.map((entry) => entry.activity_id).filter((id): id is string => Boolean(id))
    );
    const formatFocusByActivity = await loadFormatFocus(
      entries
        .filter((entry) => entry.activity_id)
        .map((entry) => ({
          id: entry.activity_id as string,
          format_id: entry.activity_format_id,
          focus_id: entry.activity_focus_id,
          secondary_focus_id: entry.activity_secondary_focus_id,
        }))
    );

    // Times and the total always come from the shared schedule calculation.
    const schedule = computeSchedule(
      programData.start_time,
      entries.map((entry) => ({ ...entry, activity_duration_minutes: entry.activity_duration }))
    );

    // Transform the flat structure to the nested structure expected by the interface
    const transformedEntries = schedule.entries.map(entry => ({
      id: entry.id,
      position: entry.position,
      start_time: entry.start_time,
      end_time: entry.end_time,
      entry_type: entry.entry_type,
      custom_title: entry.custom_title,
      custom_duration_minutes: entry.custom_duration_minutes,
      activity: entry.activity_id ? {
        id: entry.activity_id,
        name: entry.activity_name || '',
        approximate_duration_minutes: entry.activity_duration || 0,
        group_sizes: categoriesByActivity.get(entry.activity_id)?.group_sizes ?? [],
        effort_level: entry.activity_effort_level || '',
        locations: categoriesByActivity.get(entry.activity_id)?.locations ?? [],
        age_groups: categoriesByActivity.get(entry.activity_id)?.age_groups ?? [],
        format: formatFocusByActivity.get(entry.activity_id)?.format ?? null,
        focus: formatFocusByActivity.get(entry.activity_id)?.focus ?? null,
        secondary_focus: formatFocusByActivity.get(entry.activity_id)?.secondary_focus ?? null,
      } : null
    }));

    const totalDuration = schedule.total_minutes;

    // For now, we'll skip the complex educational goals and SDGs queries
    // and focus on the core functionality. This can be enhanced later.
    const educationalGoalsData: Array<{
      id: string;
      title: string;
      code: string;
    }> = [];
    const sdgsData: Array<{
      id: string;
      number: number;
      name: string;
      icon_url: string;
    }> = [];

    const response = NextResponse.json({
      program: {
        ...programData,
        entries: transformedEntries,
        summary: {
          total_duration_minutes: totalDuration,
          entry_count: transformedEntries.length,
          educational_goals: educationalGoalsData,
          sdgs: sdgsData
        }
      }
    });
    
    logApiResponse('GET', '/api/programs/[id]', 200);
    return response;
});

const updateProgramSchema = z.object({
  name: z.string().trim().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().or(z.literal('')),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  is_public: z.boolean().optional(),
});

export const PUT = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  logApiRequest('PUT', '/api/programs/[id]');
  
  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return apiErrors.unauthorized();
  }

  const { id: programId } = await params;
  
  // Validate program ID
  const uuidValidation = validateUUID(programId);
  if (!uuidValidation.success) {
    return apiErrors.validation('id', 'ID do programa inválido');
  }
  
  const parsed = updateProgramSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiErrors.validation(
      parsed.error.issues[0]?.path.join('.') || 'name, start_time',
      'Nome e hora de início são obrigatórios'
    );
  }
  const { name, date, start_time, is_public } = parsed.data;

    // Check if program exists and belongs to user
    const [existingProgram] = await db
      .select()
      .from(programs)
      .where(and(
        eq(programs.id, programId),
        eq(programs.user_id, session.user.id)
      ));

    if (!existingProgram) {
      return apiErrors.notFound('programa', programId);
    }

    // Update program; a new start time moves every entry, so recalculate in the same transaction.
    const updatedProgram = await db.transaction(async (tx) => {
      const [row] = await tx
        .update(programs)
        .set({
          name,
          date: date || null,
          start_time,
          ...(is_public === undefined ? {} : { is_public }),
          updated_at: new Date(),
        })
        .where(eq(programs.id, programId))
        .returning();
      if (timeToMinutes(existingProgram.start_time) !== timeToMinutes(start_time)) {
        await recalculateProgramSchedule(programId, tx);
      }
      return row;
    });

    const response = NextResponse.json({
      success: true,
      program: updatedProgram
    });
    
    logApiResponse('PUT', '/api/programs/[id]', 200);
    return response;
});

export const DELETE = withApiErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  logApiRequest('DELETE', '/api/programs/[id]');
  
  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return apiErrors.unauthorized();
  }

  const { id: programId } = await params;
  
  // Validate program ID
  const uuidValidation = validateUUID(programId);
  if (!uuidValidation.success) {
    return apiErrors.validation('id', 'ID do programa inválido');
  }

    // Check if program exists and belongs to user
    const [existingProgram] = await db
      .select()
      .from(programs)
      .where(and(
        eq(programs.id, programId),
        eq(programs.user_id, session.user.id)
      ));

    if (!existingProgram) {
      return apiErrors.notFound('programa', programId);
    }

    // Delete program (cascades to entries due to foreign key constraint)
    await db
      .delete(programs)
      .where(eq(programs.id, programId));

    const response = NextResponse.json({
      success: true
    });
    
    logApiResponse('DELETE', '/api/programs/[id]', 200);
    return response;
});

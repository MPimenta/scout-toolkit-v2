import { NextRequest, NextResponse } from 'next/server';
import { and, count, eq, gte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/server';
import { apiErrors, handleApiError } from '@/lib/errors';
import { recalculateProgramSchedule } from '@/lib/programs/recalculate';
import { recordProgramAdd, setVisitorCookie } from '@/lib/usage/from-request';
import { programs, programEntries } from '../../../../../../drizzle/schema';

/**
 * Entry times are always computed by the server from the program start time and the
 * entry order (src/lib/programs/schedule.ts). Client-sent start/end times are ignored.
 */
const PLACEHOLDER_TIME = '00:00';

const entryShape = z.discriminatedUnion('entry_type', [
  z.object({
    entry_type: z.literal('activity'),
    // null only for an existing entry whose activity was removed from the catalogue
    activity_id: z.string().uuid().nullable(),
  }),
  z.object({
    entry_type: z.literal('custom'),
    custom_title: z.string().trim().min(1).max(200),
    custom_duration_minutes: z.coerce.number().int().positive().max(24 * 60),
  }),
]);

const createEntrySchema = z.intersection(
  entryShape,
  z.object({ position: z.coerce.number().int().min(0).optional() })
);

const replaceEntriesSchema = z.object({
  entries: z.array(z.intersection(entryShape, z.object({ id: z.string().uuid().optional() }))),
});

async function findOwnedProgram(programId: string, userId: string) {
  const [program] = await db
    .select({ id: programs.id })
    .from(programs)
    .where(and(eq(programs.id, programId), eq(programs.user_id, userId)));
  return program ?? null;
}

function validationError(error: z.ZodError) {
  const field = error.issues[0]?.path.join('.') || 'entry';
  return apiErrors.validation(field, 'Dados da entrada inválidos');
}

/** Adds one entry. Without a position it goes last; with one, later entries move down. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiErrors.unauthorized();
    }

    const { id: programId } = await params;
    const parsed = createEntrySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    if (!(await findOwnedProgram(programId, session.user.id))) {
      return apiErrors.notFound('programa', programId);
    }

    const data = parsed.data;
    if (data.entry_type === 'activity' && !data.activity_id) {
      return apiErrors.validation('activity_id', 'Escolhe uma atividade');
    }
    const entry = await db.transaction(async (tx) => {
      const [{ total }] = await tx
        .select({ total: count() })
        .from(programEntries)
        .where(eq(programEntries.program_id, programId));
      const position = Math.min(data.position ?? total, total);

      if (position < total) {
        await tx
          .update(programEntries)
          .set({ position: sql`${programEntries.position} + 1` })
          .where(and(eq(programEntries.program_id, programId), gte(programEntries.position, position)));
      }

      const [inserted] = await tx
        .insert(programEntries)
        .values({
          program_id: programId,
          position,
          start_time: PLACEHOLDER_TIME,
          end_time: PLACEHOLDER_TIME,
          entry_type: data.entry_type,
          activity_id: data.entry_type === 'activity' ? data.activity_id : null,
          custom_title: data.entry_type === 'custom' ? data.custom_title : null,
          custom_duration_minutes: data.entry_type === 'custom' ? data.custom_duration_minutes : null,
        })
        .returning({ id: programEntries.id });

      const schedule = await recalculateProgramSchedule(programId, tx);
      const scheduled = schedule?.entries.find((e) => e.id === inserted!.id);
      return {
        id: inserted!.id,
        program_id: programId,
        position: schedule?.entries.findIndex((e) => e.id === inserted!.id) ?? position,
        start_time: scheduled?.start_time ?? PLACEHOLDER_TIME,
        end_time: scheduled?.end_time ?? PLACEHOLDER_TIME,
        entry_type: data.entry_type,
        activity_id: data.entry_type === 'activity' ? data.activity_id : null,
        custom_title: data.entry_type === 'custom' ? data.custom_title : null,
        custom_duration_minutes: data.entry_type === 'custom' ? data.custom_duration_minutes : null,
      };
    });

    // Usage tracking: only after the entry exists; a failure to record never fails the request.
    const visitor =
      data.entry_type === 'activity' && data.activity_id
        ? await recordProgramAdd(request, { userId: session.user.id, activityId: data.activity_id, programId })
        : null;

    return setVisitorCookie(NextResponse.json({ entry }, { status: 201 }), visitor);
  } catch (error) {
    return handleApiError(error, 'POST /api/programs/[id]/entries');
  }
}

/** Replaces the whole schedule in the given order (used for remove, reorder and edit). */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiErrors.unauthorized();
    }

    const { id: programId } = await params;
    const parsed = replaceEntriesSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    if (!(await findOwnedProgram(programId, session.user.id))) {
      return apiErrors.notFound('programa', programId);
    }

    const { entries } = parsed.data;
    await db.transaction(async (tx) => {
      await tx.delete(programEntries).where(eq(programEntries.program_id, programId));
      if (entries.length > 0) {
        await tx.insert(programEntries).values(
          entries.map((entry, position) => ({
            ...(entry.id ? { id: entry.id } : {}),
            program_id: programId,
            position,
            start_time: PLACEHOLDER_TIME,
            end_time: PLACEHOLDER_TIME,
            entry_type: entry.entry_type,
            activity_id: entry.entry_type === 'activity' ? entry.activity_id : null,
            custom_title: entry.entry_type === 'custom' ? entry.custom_title : null,
            custom_duration_minutes: entry.entry_type === 'custom' ? entry.custom_duration_minutes : null,
          }))
        );
      }
      await recalculateProgramSchedule(programId, tx);
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return handleApiError(error, 'PUT /api/programs/[id]/entries');
  }
}

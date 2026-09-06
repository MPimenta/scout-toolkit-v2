import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/server';
import { programEntries, programs } from '../../../../../../../drizzle/schema';
import { apiErrors, withApiErrorHandler } from '@/lib/errors';
import { validateUUID } from '@/lib/errors/error-handler';
import { getPublicProgram } from '@/lib/programs/public';
import { ensureOrgoProgramColumns } from '@/lib/orgo/ensure-columns';

export const POST = withApiErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth();
  if (!session?.user?.id) {
    return apiErrors.unauthorized();
  }

  const { id } = await params;
  if (!validateUUID(id).success) {
    return apiErrors.validation('id', 'ID do programa inválido');
  }

  const source = await getPublicProgram(id);
  if (!source) {
    return apiErrors.notFound('programa', id);
  }

  await ensureOrgoProgramColumns();

  const [copied] = await db
    .insert(programs)
    .values({
      name: `${source.name} (cópia)`,
      date: source.date,
      start_time: source.start_time,
      user_id: session.user.id,
      is_public: false,
      source_program_id: source.id,
      source_author_name: source.author_name,
    })
    .returning();

  if (source.entries.length > 0) {
    await db.insert(programEntries).values(
      source.entries.map((entry) => ({
        program_id: copied.id,
        position: entry.position,
        start_time: entry.start_time,
        end_time: entry.end_time,
        entry_type: entry.entry_type as 'activity' | 'custom',
        activity_id: entry.activity_id,
        custom_title: entry.custom_title,
        custom_duration_minutes: entry.custom_duration_minutes,
      }))
    );
  }

  const [owned] = await db
    .select({ id: programs.id, is_public: programs.is_public })
    .from(programs)
    .where(eq(programs.id, copied.id));

  return NextResponse.json({
    success: true,
    program: owned,
    attribution: source.author_name,
  }, { status: 201 });
});

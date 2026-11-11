import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import {
  apiErrors,
  logApiRequest,
  logApiResponse,
  withApiErrorHandler,
} from '@/lib/errors';
import { validateUUID } from '@/lib/errors/error-handler';
import { isOrgoPending } from '@/lib/orgo/claim';
import { getOrgoAttendanceCounts } from '@/lib/orgo/client';
import { orgoMode, requireOwnedProgram } from '@/lib/orgo/leader-context';

/**
 * How many members were invited to the program's Orgo event, and how many answered
 * "attending" (checked in on the attendance page, or said yes): counts only, never names.
 * Who exactly was present is checked in eAEP, not copied into this app.
 */
export const GET = withApiErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  logApiRequest('GET', '/api/programs/[id]/orgo/attendance');
  const session = await auth();
  if (!session?.user?.id) {
    return apiErrors.unauthorized();
  }

  const { id: programId } = await params;
  if (!validateUUID(programId).success) {
    return apiErrors.validation('id', 'ID do programa inválido');
  }

  const program = await requireOwnedProgram(programId, session.user.id);
  if (!program) {
    return apiErrors.notFound('programa', programId);
  }
  const uuid = program.orgo_event_uuid;
  if (!uuid || isOrgoPending(uuid)) {
    return apiErrors.conflict('Este programa ainda não tem um evento no eAEP');
  }

  // Only the real Orgo has attendance to read; the e2e stub and an unconfigured setup have none.
  let counts: { invited: number | null; attending: number | null } = { invited: null, attending: null };
  if (orgoMode(session.user.email) === 'live') {
    counts = (await getOrgoAttendanceCounts(uuid).catch(() => null)) ?? counts;
  }

  logApiResponse('GET', '/api/programs/[id]/orgo/attendance', 200, {
    known: counts.invited !== null,
  });
  return NextResponse.json({ data: counts });
});

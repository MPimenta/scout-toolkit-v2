import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/server';
import { programEntries, programs } from '../../../../../../drizzle/schema';
import {
  apiErrors,
  logApiRequest,
  logApiResponse,
  withApiErrorHandler,
} from '@/lib/errors';
import { validateUUID } from '@/lib/errors/error-handler';
import {
  E2E_STUB_UNITS,
  OrgoRequestError,
  createOrgoEvent,
  listEventCreateUnitsForEmail,
  publishOrgoEvent,
} from '@/lib/orgo/client';
import { isE2EOrgoStub, isOrgoWriteConfigured } from '@/lib/orgo/config';
import { ensureOrgoProgramColumns } from '@/lib/orgo/ensure-columns';
import { toOrgoEventPayload } from '@/lib/orgo/map-event';

async function requireOwnedProgram(programId: string, userId: string) {
  const [program] = await db
    .select({
      id: programs.id,
      name: programs.name,
      date: programs.date,
      start_time: programs.start_time,
      is_public: programs.is_public,
      user_id: programs.user_id,
      orgo_event_uuid: programs.orgo_event_uuid,
      orgo_event_url: programs.orgo_event_url,
    })
    .from(programs)
    .where(eq(programs.id, programId));

  if (!program || program.user_id !== userId) {
    return null;
  }
  return program;
}

export const GET = withApiErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  logApiRequest('GET', '/api/programs/[id]/orgo');
  await ensureOrgoProgramColumns();
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

  if (!isOrgoWriteConfigured()) {
    if (isE2EOrgoStub(session.user.email)) {
      logApiResponse('GET', '/api/programs/[id]/orgo', 200);
      return NextResponse.json({ units: E2E_STUB_UNITS, configured: false, stub: true });
    }
    return apiErrors.unavailable('Integração Orgo não configurada');
  }

  const units = await listEventCreateUnitsForEmail(session.user.email);
  logApiResponse('GET', '/api/programs/[id]/orgo', 200);
  return NextResponse.json({ units, configured: true });
});

export const POST = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  logApiRequest('POST', '/api/programs/[id]/orgo');
  await ensureOrgoProgramColumns();
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

  if (program.orgo_event_uuid) {
    return apiErrors.conflict('Este programa já tem um evento no eAEP');
  }

  const body = (await request.json()) as {
    dateTimeBegin?: string;
    dateTimeEnd?: string;
    location?: string;
    unit?: string;
    maxCapacity?: number | null;
    publish?: boolean;
    timezone?: string;
  };

  const entries = await db
    .select({
      end_time: programEntries.end_time,
      custom_title: programEntries.custom_title,
    })
    .from(programEntries)
    .where(eq(programEntries.program_id, programId));

  const stub = isE2EOrgoStub(session.user.email);
  if (!isOrgoWriteConfigured() && !stub) {
    return apiErrors.unavailable('Integração Orgo não configurada');
  }

  const units = stub
    ? E2E_STUB_UNITS
    : await listEventCreateUnitsForEmail(session.user.email);

  if (units.length === 0) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Não tem unidades Orgo onde possa criar eventos.' } },
      { status: 400 }
    );
  }

  if (!body.unit || !units.some((unit) => unit.iri === body.unit)) {
    return apiErrors.validation('unit', 'Escolha uma unidade onde possa criar eventos');
  }

  if (!body.dateTimeEnd) {
    return apiErrors.validation('dateTimeEnd', 'Indique a data e hora de fim');
  }

  let payload;
  try {
    payload = toOrgoEventPayload(
      {
        name: program.name,
        date: program.date,
        start_time: program.start_time,
        is_public: program.is_public,
        userName: session.user.name,
        entries,
      },
      {
        dateTimeBegin: body.dateTimeBegin,
        dateTimeEnd: body.dateTimeEnd,
        location: body.location ?? '',
        unit: body.unit,
        maxCapacity: body.maxCapacity,
        publish: Boolean(body.publish),
        timezone: body.timezone,
      }
    );
  } catch (error) {
    return apiErrors.validation(
      'dialog',
      error instanceof Error ? error.message : 'Dados do evento inválidos'
    );
  }

  try {
    const created = stub
      ? { uuid: `e2e-${program.id}`, url: `https://eaep.escoteiros.pt/events/e2e-${program.id}` }
      : await createOrgoEvent(payload);

    if (!stub && body.publish) {
      await publishOrgoEvent(created.uuid);
    }

    await db
      .update(programs)
      .set({
        orgo_event_uuid: created.uuid,
        orgo_event_url: created.url,
        updated_at: new Date(),
      })
      .where(eq(programs.id, programId));

    logApiResponse('POST', '/api/programs/[id]/orgo', 201);
    return NextResponse.json({
      orgo_event_uuid: created.uuid,
      orgo_event_url: created.url,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof OrgoRequestError) {
      return NextResponse.json(
        { error: { code: 'NETWORK_ERROR', message: `O eAEP recusou o evento: ${error.message}` } },
        { status: 502 }
      );
    }
    throw error;
  }
});

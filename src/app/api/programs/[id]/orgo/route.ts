import { NextRequest, NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/server';
import { activities, programEntries, programs } from '../../../../../../drizzle/schema';
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
import {
  claimProgramForOrgo,
  isOrgoPending,
  releaseOrgoClaim,
  storeOrgoEvent,
} from '@/lib/orgo/claim';
import { isE2EOrgoStub, isOrgoWriteConfigured } from '@/lib/orgo/config';
import { defaultBeginDateTime, toOrgoEventPayload } from '@/lib/orgo/map-event';
import { computeSchedule } from '@/lib/programs/schedule';

const createEventSchema = z.object({
  dateTimeBegin: z.string().min(1).nullable().optional(),
  dateTimeEnd: z.string().min(1),
  location: z.string().max(500).optional().default(''),
  unit: z.string().min(1),
  maxCapacity: z.number().int().positive().nullable().optional(),
  publish: z.boolean().optional().default(false),
  timezone: z.string().max(64).optional(),
});

const FIELD_MESSAGES: Record<string, string> = {
  dateTimeEnd: 'Indica a data e hora de fim',
  unit: 'Escolhe uma unidade onde possas criar eventos',
  maxCapacity: 'A capacidade tem de ser um número inteiro positivo',
  publish: 'Opção de publicação inválida',
};

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
  const pending = isOrgoPending(program.orgo_event_uuid);

  if (!isOrgoWriteConfigured()) {
    if (isE2EOrgoStub(session.user.email)) {
      logApiResponse('GET', '/api/programs/[id]/orgo', 200);
      return NextResponse.json({ units: E2E_STUB_UNITS, configured: false, stub: true, pending });
    }
    return apiErrors.unavailable('Integração Orgo não configurada');
  }

  const units = await listEventCreateUnitsForEmail(session.user.email);
  logApiResponse('GET', '/api/programs/[id]/orgo', 200);
  return NextResponse.json({ units, configured: true, pending });
});

export const POST = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  logApiRequest('POST', '/api/programs/[id]/orgo');
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

  if (isOrgoPending(program.orgo_event_uuid)) {
    return apiErrors.conflict('O evento no eAEP já está a ser criado. Aguarda um momento.');
  }
  if (program.orgo_event_uuid) {
    return apiErrors.conflict('Este programa já tem um evento no eAEP');
  }

  // 1. Validate the dialog before talking to Orgo.
  const parsed = createEventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? 'dialog');
    return apiErrors.validation(field, FIELD_MESSAGES[field] ?? 'Dados do evento inválidos');
  }
  const body = parsed.data;

  const begin = body.dateTimeBegin ?? defaultBeginDateTime({ ...program, entries: [] });
  if (begin && Date.parse(body.dateTimeEnd) <= Date.parse(begin)) {
    return apiErrors.validation('dateTimeEnd', 'A data e hora de fim têm de ser depois do início');
  }

  const stub = isE2EOrgoStub(session.user.email);
  if (!isOrgoWriteConfigured() && !stub) {
    return apiErrors.unavailable('Integração Orgo não configurada');
  }

  const units = stub ? E2E_STUB_UNITS : await listEventCreateUnitsForEmail(session.user.email);
  if (units.length === 0) {
    return apiErrors.validation('unit', 'Não tens unidades Orgo onde possas criar eventos.');
  }
  if (!units.some((unit) => unit.iri === body.unit)) {
    return apiErrors.validation('unit', FIELD_MESSAGES['unit']);
  }

  // Entry times come from the shared schedule calculation, like the program page.
  const rows = await db
    .select({
      entry_type: programEntries.entry_type,
      custom_title: programEntries.custom_title,
      custom_duration_minutes: programEntries.custom_duration_minutes,
      activity_name: activities.name,
      activity_duration_minutes: activities.approximate_duration_minutes,
    })
    .from(programEntries)
    .leftJoin(activities, eq(programEntries.activity_id, activities.id))
    .where(eq(programEntries.program_id, programId))
    .orderBy(asc(programEntries.position));
  const entries = computeSchedule(program.start_time, rows).entries.map((entry) => ({
    end_time: entry.end_time,
    custom_title: entry.custom_title,
    activity: entry.activity_name ? { name: entry.activity_name } : null,
  }));

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
        location: body.location,
        unit: body.unit,
        maxCapacity: body.maxCapacity,
        publish: body.publish,
        timezone: body.timezone,
      }
    );
  } catch (error) {
    return apiErrors.validation('dialog', error instanceof Error ? error.message : 'Dados do evento inválidos');
  }

  // 2. Claim the program so concurrent requests cannot create a second event.
  if (!(await claimProgramForOrgo(programId, session.user.id))) {
    return apiErrors.conflict('Este programa já tem um evento no eAEP');
  }

  // 3. Create the event; give the claim back if Orgo refuses.
  let created;
  try {
    created = stub
      ? { uuid: `e2e-${program.id}`, url: `https://eaep.escoteiros.pt/events/e2e-${program.id}` }
      : await createOrgoEvent(payload);
  } catch (error) {
    await releaseOrgoClaim(programId);
    if (error instanceof OrgoRequestError) {
      return NextResponse.json(
        { error: { code: 'NETWORK_ERROR', message: `O eAEP recusou o evento: ${error.message}` } },
        { status: 502 }
      );
    }
    throw error;
  }

  // 4. Store it before publishing, so a publish failure never leads to a duplicate.
  await storeOrgoEvent(programId, created.uuid, created.url);

  let published = false;
  let warning: string | undefined;
  if (body.publish) {
    if (stub) {
      published = true;
    } else {
      try {
        await publishOrgoEvent(created.uuid);
        published = true;
      } catch {
        warning = 'O evento foi criado como rascunho, mas o eAEP não o publicou. Publica-o no eAEP.';
      }
    }
  }

  logApiResponse('POST', '/api/programs/[id]/orgo', 201);
  return NextResponse.json(
    {
      orgo_event_uuid: created.uuid,
      orgo_event_url: created.url,
      published,
      ...(warning ? { warning } : {}),
    },
    { status: 201 }
  );
});

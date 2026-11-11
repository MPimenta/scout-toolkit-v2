import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import {
  apiErrors,
  logApiRequest,
  logApiResponse,
  withApiErrorHandler,
} from '@/lib/errors';
import { validateUUID } from '@/lib/errors/error-handler';
import { OrgoRequestError, createOrgoEvent } from '@/lib/orgo/client';
import {
  claimProgramForOrgo,
  isOrgoPending,
  releaseOrgoClaim,
  storeOrgoEvent,
} from '@/lib/orgo/claim';
import { orgoAttendanceUrl, orgoEventUrl } from '@/lib/orgo/config';
import { buildOrgoDescription } from '@/lib/orgo/description';
import { loadDescriptionProgram } from '@/lib/orgo/description-data';
import {
  listMembersInScope,
  loadLeaderContext,
  orgoMode,
  requireOwnedProgram,
} from '@/lib/orgo/leader-context';
import { defaultBeginDateTime, toOrgoEventPayload } from '@/lib/orgo/map-event';
import {
  MAX_PARTICIPANTS,
  findForgedMemberIds,
  offeredMemberIds,
} from '@/lib/orgo/participants';
import {
  runAttachmentStep,
  runInvitationsStep,
  runPublishStep,
  saveOrgoSteps,
  skippedInvitations,
} from '@/lib/orgo/steps';
import type { OrgoSteps } from '@/types/orgo-steps';

const createEventSchema = z.object({
  dateTimeBegin: z.string().min(1).nullable().optional(),
  dateTimeEnd: z.string().min(1),
  location: z.string().max(500).optional().default(''),
  unit: z.string().min(1),
  maxCapacity: z.number().int().positive().nullable().optional(),
  publish: z.boolean().optional().default(false),
  timezone: z.string().max(64).optional(),
  // Orgo member ids chosen in the dialog. Only counted and sent, never stored.
  participants: z.array(z.string().regex(/^\d+$/)).max(MAX_PARTICIPANTS).optional().default([]),
  attachment: z.boolean().optional().default(false),
});

const FIELD_MESSAGES: Record<string, string> = {
  dateTimeEnd: 'Indica a data e hora de fim',
  unit: 'Escolhe uma unidade onde possas criar eventos',
  maxCapacity: 'A capacidade tem de ser um número inteiro positivo',
  publish: 'Opção de publicação inválida',
  participants: `Escolhe no máximo ${MAX_PARTICIPANTS} participantes do teu grupo`,
  attachment: 'Opção de anexo inválida',
};

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

  const mode = orgoMode(session.user.email);
  if (mode === 'off') {
    return apiErrors.unavailable('Integração Orgo não configurada');
  }

  const context = await loadLeaderContext({ id: session.user.id, email: session.user.email });
  logApiResponse('GET', '/api/programs/[id]/orgo', 200);
  return NextResponse.json({
    units: context?.units ?? [],
    configured: mode === 'live',
    ...(mode === 'stub' ? { stub: true } : {}),
    pending,
  });
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
  const participantIds = [...new Set(body.participants)];

  const begin = body.dateTimeBegin ?? defaultBeginDateTime({ ...program, entries: [] });
  if (begin && Date.parse(body.dateTimeEnd) <= Date.parse(begin)) {
    return apiErrors.validation('dateTimeEnd', 'A data e hora de fim têm de ser depois do início');
  }

  const mode = orgoMode(session.user.email);
  if (mode === 'off') {
    return apiErrors.unavailable('Integração Orgo não configurada');
  }

  // 2. The leader's rights come from Orgo, never from the request.
  const context = await loadLeaderContext({ id: session.user.id, email: session.user.email });
  if (!context || context.units.length === 0) {
    return apiErrors.validation('unit', 'Não tens unidades Orgo onde possas criar eventos.');
  }
  if (!context.units.some((unit) => unit.iri === body.unit)) {
    return apiErrors.validation('unit', FIELD_MESSAGES['unit']);
  }
  if (participantIds.length > 0 && !body.publish) {
    return apiErrors.validation(
      'participants',
      'Só é possível convidar participantes num evento publicado. Liga a opção de publicar.'
    );
  }
  if (body.attachment && !program.is_public) {
    return apiErrors.validation(
      'attachment',
      'O PDF só pode ser anexado a programas públicos, porque o eAEP guarda os ficheiros com acesso por ligação.'
    );
  }
  if (participantIds.length > 0) {
    const offered = offeredMemberIds(await listMembersInScope(context));
    if (findForgedMemberIds(participantIds, offered).length > 0) {
      return apiErrors.validation('participants', 'Alguns participantes não pertencem ao teu grupo.');
    }
  }

  // 3. The event, with the full description built from the program.
  let payload;
  try {
    const description = buildOrgoDescription(
      await loadDescriptionProgram({ id: program.id, name: program.name, start_time: program.start_time })
    );
    payload = toOrgoEventPayload(
      {
        name: program.name,
        date: program.date,
        start_time: program.start_time,
        is_public: program.is_public,
        userName: session.user.name,
        entries: [],
      },
      {
        dateTimeBegin: body.dateTimeBegin,
        dateTimeEnd: body.dateTimeEnd,
        location: body.location,
        unit: body.unit,
        maxCapacity: body.maxCapacity,
        publish: body.publish,
        timezone: body.timezone,
      },
      description
    );
  } catch (error) {
    return apiErrors.validation('dialog', error instanceof Error ? error.message : 'Dados do evento inválidos');
  }

  // 4. Claim the program so concurrent requests cannot create a second event.
  if (!(await claimProgramForOrgo(programId, session.user.id))) {
    return apiErrors.conflict('Este programa já tem um evento no eAEP');
  }

  // 5. Create the event; give the claim back if Orgo refuses.
  let created;
  try {
    created = context.stub
      ? { uuid: `e2e-${program.id}` }
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

  // 6. Store it before any later step, so a failed step never leads to a duplicate event.
  const eventUrl = orgoEventUrl(created.uuid);
  await storeOrgoEvent(programId, created.uuid, eventUrl);

  // 7. Later steps, in order: publish, invitations (need the event published), attachment.
  const steps: OrgoSteps = {};
  if (body.publish) {
    steps.publish = await runPublishStep(created.uuid, context.stub);
  }
  if (participantIds.length > 0) {
    steps.invitations =
      steps.publish?.status === 'done'
        ? await runInvitationsStep(created.uuid, participantIds, context.stub)
        : skippedInvitations(
            participantIds.length,
            'Os participantes só podem ser convidados depois de o evento ser publicado.'
          );
  }
  if (body.attachment) {
    steps.attachment = await runAttachmentStep(program.id, created.uuid, context.stub);
  }
  const saved = Object.keys(steps).length > 0 ? await saveOrgoSteps(programId, steps) : steps;

  // Counts only: no names, ids or emails ever reach the logs.
  logApiResponse('POST', '/api/programs/[id]/orgo', 201, {
    published: saved.publish?.status === 'done',
    invited: saved.invitations?.added ?? 0,
    invitationsFailed: saved.invitations?.failed ?? 0,
    attachment: saved.attachment?.status ?? 'none',
  });
  return NextResponse.json(
    {
      orgo_event_uuid: created.uuid,
      orgo_event_url: eventUrl,
      orgo_event_attendance_url: orgoAttendanceUrl(created.uuid),
      published: saved.publish?.status === 'done',
      steps: saved,
      ...(saved.publish?.status === 'failed' && saved.publish.reason
        ? { warning: saved.publish.reason }
        : {}),
    },
    { status: 201 }
  );
});

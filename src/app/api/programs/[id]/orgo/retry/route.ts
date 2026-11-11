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
import { getOrgoEvent } from '@/lib/orgo/client';
import { isOrgoPending } from '@/lib/orgo/claim';
import {
  listMembersInScope,
  loadLeaderContext,
  orgoMode,
  requireOwnedProgram,
} from '@/lib/orgo/leader-context';
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
} from '@/lib/orgo/steps';
import type { OrgoSteps } from '@/types/orgo-steps';

const retrySchema = z.object({
  step: z.enum(['publish', 'invitations', 'attachment']),
  // For invitations: the whole selection again. A member Orgo already has counts as added,
  // so nobody is invited twice.
  participants: z.array(z.string().regex(/^\d+$/)).max(MAX_PARTICIPANTS).optional().default([]),
});

/**
 * Repeats ONE step of an event that already exists in Orgo. It never creates an event, and
 * a step that already succeeded is not repeated.
 */
export const POST = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  logApiRequest('POST', '/api/programs/[id]/orgo/retry');
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
    return apiErrors.conflict('O evento no eAEP está a ser criado. Aguarda um momento.');
  }
  const uuid = program.orgo_event_uuid;
  if (!uuid) {
    return apiErrors.conflict('Este programa ainda não tem um evento no eAEP');
  }

  const parsed = retrySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiErrors.validation('step', 'Passo inválido');
  }
  const { step } = parsed.data;
  const participantIds = [...new Set(parsed.data.participants)];

  if (orgoMode(session.user.email) === 'off') {
    return apiErrors.unavailable('Integração Orgo não configurada');
  }
  const context = await loadLeaderContext({ id: session.user.id, email: session.user.email });
  if (!context) {
    return apiErrors.forbidden('Já não tens permissões para criar eventos no eAEP');
  }

  if (program.orgo_steps?.[step]?.status === 'done') {
    logApiResponse('POST', '/api/programs/[id]/orgo/retry', 200, { step, repeated: false });
    return NextResponse.json({ steps: program.orgo_steps });
  }

  let patch: OrgoSteps;
  if (step === 'publish') {
    patch = { publish: await runPublishStep(uuid, context.stub) };
  } else if (step === 'invitations') {
    if (participantIds.length === 0) {
      return apiErrors.validation('participants', 'Escolhe os participantes a convidar');
    }
    const offered = offeredMemberIds(await listMembersInScope(context));
    if (findForgedMemberIds(participantIds, offered).length > 0) {
      return apiErrors.validation('participants', 'Alguns participantes não pertencem ao teu grupo.');
    }
    const published = context.stub || (await getOrgoEvent(uuid).catch(() => null))?.status === 'published';
    if (!published) {
      return apiErrors.conflict('Publica o evento antes de convidar participantes.');
    }
    patch = { invitations: await runInvitationsStep(uuid, participantIds, context.stub) };
  } else {
    if (!program.is_public) {
      return apiErrors.validation(
        'attachment',
        'O PDF só pode ser anexado a programas públicos, porque o eAEP guarda os ficheiros com acesso por ligação.'
      );
    }
    patch = { attachment: await runAttachmentStep(program.id, uuid, context.stub) };
  }

  const steps = await saveOrgoSteps(programId, patch);
  logApiResponse('POST', '/api/programs/[id]/orgo/retry', 200, {
    step,
    status: steps[step]?.status ?? 'none',
  });
  return NextResponse.json({ steps });
});

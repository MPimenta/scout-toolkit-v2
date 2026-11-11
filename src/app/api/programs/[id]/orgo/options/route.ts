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
import { buildExportFilename } from '@/lib/export/labels';
import {
  listMembersInScope,
  loadLeaderContext,
  orgoMode,
  requireOwnedProgram,
} from '@/lib/orgo/leader-context';
import { loadDescriptionProgram } from '@/lib/orgo/description-data';
import { buildParticipantTree } from '@/lib/orgo/participants';

/**
 * What the Orgo dialog may offer this owner: the units of their own local group, whether
 * they can publish, whether the PDF may be attached, and the members they may invite.
 * Rights are read from Orgo on every call; the browser never decides them. Member names go
 * to this owner's browser only, and nothing about them is stored or logged.
 */
export const GET = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  logApiRequest('GET', '/api/programs/[id]/orgo/options');
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

  const mode = orgoMode(session.user.email);
  if (mode === 'off') {
    return apiErrors.unavailable('Integração Orgo não configurada');
  }

  const query = (new URL(request.url).searchParams.get('q') ?? '').slice(0, 100);
  const context = await loadLeaderContext({ id: session.user.id, email: session.user.email });

  // What the event description will contain, as counts: the dialog never renders the HTML itself.
  const built = await loadDescriptionProgram({
    id: program.id,
    name: program.name,
    start_time: program.start_time,
  });
  const descriptionSummary = { blocks: built.blocks.length, challenges: built.challenges.length };

  const attachment = {
    allowed: program.is_public,
    fileName: buildExportFilename(program.name, 'pdf'),
    reason: program.is_public ? null : ('private' as const),
  };

  if (!context) {
    // No event permission, or the leader's scope cannot be determined: nothing to offer.
    logApiResponse('GET', '/api/programs/[id]/orgo/options', 200);
    return NextResponse.json({
      data: {
        pending: isOrgoPending(program.orgo_event_uuid),
        stub: false,
        units: [],
        groupName: null,
        canPublish: false,
        participants: null,
        attachment,
        descriptionSummary,
      },
    });
  }

  const members = await listMembersInScope(context);
  const participants = buildParticipantTree(members, context.localUnits, context.groupName, query);

  logApiResponse('GET', '/api/programs/[id]/orgo/options', 200, { members: members.length });
  return NextResponse.json({
    data: {
      pending: isOrgoPending(program.orgo_event_uuid),
      stub: context.stub,
      units: context.units,
      groupName: context.groupName,
      // An event permission lets the leader publish; Orgo is asked again when publishing.
      canPublish: true,
      participants,
      attachment,
      descriptionSummary,
    },
  });
});

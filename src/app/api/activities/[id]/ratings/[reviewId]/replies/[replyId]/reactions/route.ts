import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { parseReactionKey } from '@/lib/ratings';
import {
  activityExists,
  findReply,
  findReviewById,
  upsertReplyReaction,
} from '@/lib/ratings/store';
import {
  apiErrors,
  logApiRequest,
  logApiResponse,
  withApiErrorHandler,
} from '@/lib/errors';
import { validateUUID } from '@/lib/errors/error-handler';

export const POST = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string; replyId: string }> }
) => {
  logApiRequest('POST', '/api/activities/[id]/ratings/[reviewId]/replies/[replyId]/reactions');

  const session = await auth();
  if (!session?.user?.id) {
    return apiErrors.unauthorized();
  }

  const { id: activityId, reviewId, replyId } = await params;
  if (
    !validateUUID(activityId).success ||
    !validateUUID(reviewId).success ||
    !validateUUID(replyId).success
  ) {
    return apiErrors.validation('id', 'ID inválido');
  }

  if (!(await activityExists(activityId))) {
    return apiErrors.notFound('atividade', activityId);
  }
  if (!(await findReviewById(reviewId, activityId))) {
    return apiErrors.notFound('avaliação', reviewId);
  }
  if (!(await findReply(replyId, reviewId))) {
    return apiErrors.notFound('resposta', replyId);
  }

  const body = await request.json().catch(() => ({}));
  const key = parseReactionKey(body.key);
  if (!key) {
    return apiErrors.validation('key', 'Reação inválida');
  }

  const myReaction = await upsertReplyReaction(replyId, session.user.id, key);
  logApiResponse('POST', '/api/activities/[id]/ratings/[reviewId]/replies/[replyId]/reactions', 200);
  return NextResponse.json({ myReaction });
});

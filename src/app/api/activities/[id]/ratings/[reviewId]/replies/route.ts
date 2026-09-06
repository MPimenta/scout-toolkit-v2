import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { parseReplyBody } from '@/lib/ratings';
import {
  activityExists,
  findReviewById,
  insertReply,
  listReplies,
} from '@/lib/ratings/store';
import {
  apiErrors,
  logApiRequest,
  logApiResponse,
  withApiErrorHandler,
} from '@/lib/errors';
import { validateUUID } from '@/lib/errors/error-handler';

export const GET = withApiErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) => {
  logApiRequest('GET', '/api/activities/[id]/ratings/[reviewId]/replies');

  const { id: activityId, reviewId } = await params;
  if (!validateUUID(activityId).success || !validateUUID(reviewId).success) {
    return apiErrors.validation('id', 'ID inválido');
  }

  if (!(await activityExists(activityId))) {
    return apiErrors.notFound('atividade', activityId);
  }
  if (!(await findReviewById(reviewId, activityId))) {
    return apiErrors.notFound('avaliação', reviewId);
  }

  const session = await auth();
  const replies = await listReplies(reviewId, session?.user?.id);
  logApiResponse('GET', '/api/activities/[id]/ratings/[reviewId]/replies', 200, {
    count: replies.length,
  });
  return NextResponse.json({ replies });
});

export const POST = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) => {
  logApiRequest('POST', '/api/activities/[id]/ratings/[reviewId]/replies');

  const session = await auth();
  if (!session?.user?.id) {
    return apiErrors.unauthorized();
  }

  const { id: activityId, reviewId } = await params;
  if (!validateUUID(activityId).success || !validateUUID(reviewId).success) {
    return apiErrors.validation('id', 'ID inválido');
  }

  if (!(await activityExists(activityId))) {
    return apiErrors.notFound('atividade', activityId);
  }
  if (!(await findReviewById(reviewId, activityId))) {
    return apiErrors.notFound('avaliação', reviewId);
  }

  const payload = await request.json().catch(() => ({}));
  const body = parseReplyBody(payload.body);
  if (!body) {
    return apiErrors.validation('body', 'A resposta deve ter entre 1 e 2000 caracteres');
  }

  const mentionUserId =
    typeof payload.mentionUserId === 'string' && validateUUID(payload.mentionUserId).success
      ? payload.mentionUserId
      : null;

  const replyId = await insertReply({
    reviewId,
    userId: session.user.id,
    body,
    mentionUserId,
  });

  logApiResponse('POST', '/api/activities/[id]/ratings/[reviewId]/replies', 201);
  return NextResponse.json(
    {
      reply: {
        id: replyId,
        reviewId,
        userId: session.user.id,
        userName: session.user.name || 'Utilizador',
        body,
        mentionUserId,
        createdAt: new Date().toISOString(),
      },
    },
    { status: 201 }
  );
});

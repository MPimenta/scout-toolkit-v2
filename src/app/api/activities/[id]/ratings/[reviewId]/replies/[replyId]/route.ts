import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { parseReplyBody } from '@/lib/ratings';
import {
  activityExists,
  deleteReply,
  findReply,
  findReviewById,
  updateReply,
} from '@/lib/ratings/store';
import {
  apiErrors,
  logApiRequest,
  logApiResponse,
  withApiErrorHandler,
} from '@/lib/errors';
import { validateUUID } from '@/lib/errors/error-handler';

export const PATCH = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string; replyId: string }> }
) => {
  logApiRequest('PATCH', '/api/activities/[id]/ratings/[reviewId]/replies/[replyId]');

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

  const reply = await findReply(replyId, reviewId);
  if (!reply) {
    return apiErrors.notFound('resposta', replyId);
  }
  if (reply.user_id !== session.user.id) {
    return apiErrors.forbidden('Só pode editar as suas respostas');
  }

  const payload = await request.json().catch(() => ({}));
  const body = parseReplyBody(payload.body);
  if (!body) {
    return apiErrors.validation('body', 'A resposta deve ter entre 1 e 2000 caracteres');
  }

  await updateReply({ replyId, reviewId, body });
  logApiResponse('PATCH', '/api/activities/[id]/ratings/[reviewId]/replies/[replyId]', 200);
  return NextResponse.json({ reply: { id: replyId, body } });
});

export const DELETE = withApiErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string; replyId: string }> }
) => {
  logApiRequest('DELETE', '/api/activities/[id]/ratings/[reviewId]/replies/[replyId]');

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

  const reply = await findReply(replyId, reviewId);
  if (!reply) {
    return apiErrors.notFound('resposta', replyId);
  }
  if (reply.user_id !== session.user.id) {
    return apiErrors.forbidden('Só pode apagar as suas respostas');
  }

  await deleteReply(replyId, reviewId);
  logApiResponse('DELETE', '/api/activities/[id]/ratings/[reviewId]/replies/[replyId]', 200);
  return NextResponse.json({ ok: true });
});

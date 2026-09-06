import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { parseVote } from '@/lib/ratings';
import { activityExists, findReviewById, upsertVote } from '@/lib/ratings/store';
import {
  apiErrors,
  logApiRequest,
  logApiResponse,
  withApiErrorHandler,
} from '@/lib/errors';
import { validateUUID } from '@/lib/errors/error-handler';

export const POST = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) => {
  logApiRequest('POST', '/api/activities/[id]/ratings/[reviewId]/vote');

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

  const body = await request.json().catch(() => ({}));
  const value = parseVote(body.value);
  if (!value) {
    return apiErrors.validation('value', 'O voto deve ser up ou down');
  }

  const myVote = await upsertVote(reviewId, session.user.id, value);
  logApiResponse('POST', '/api/activities/[id]/ratings/[reviewId]/vote', 200);
  return NextResponse.json({ myVote });
});

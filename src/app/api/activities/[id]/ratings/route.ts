import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import {
  computeAverage,
  emptyDiscussionSummary,
  parseRating,
  toPublicReview,
} from '@/lib/ratings';
import {
  activityExists,
  findOwnReview,
  insertReview,
  listActivityReviews,
  listDiscussionSummaries,
  updateReview,
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
  { params }: { params: Promise<{ id: string }> }
) => {
  logApiRequest('GET', '/api/activities/[id]/ratings');

  const { id: activityId } = await params;
  const uuidValidation = validateUUID(activityId);
  if (!uuidValidation.success) {
    return apiErrors.validation('id', 'ID da atividade inválido');
  }

  if (!(await activityExists(activityId))) {
    return apiErrors.notFound('atividade', activityId);
  }

  const session = await auth();
  const rows = await listActivityReviews(activityId);
  const summaries = await listDiscussionSummaries(
    rows.map((row) => row.id),
    session?.user?.id
  );
  const mapped = rows.map((row) => {
    const summary = summaries[row.id] ?? emptyDiscussionSummary();
    return toPublicReview({
      ...row,
      score: summary.score,
      my_vote: summary.myVote,
      reactions: summary.reactions,
      my_reaction: summary.myReaction,
      reply_count: summary.replyCount,
    });
  });
  const { average, count } = computeAverage(mapped.map((review) => review.rating));

  const mine = session?.user?.id
    ? mapped.find((review) => review.userId === session.user.id) ?? null
    : null;

  logApiResponse('GET', '/api/activities/[id]/ratings', 200, { count });
  return NextResponse.json({ average, count, reviews: mapped, mine });
});

export const POST = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  logApiRequest('POST', '/api/activities/[id]/ratings');

  const session = await auth();
  if (!session?.user?.id) {
    return apiErrors.unauthorized();
  }

  const { id: activityId } = await params;
  const uuidValidation = validateUUID(activityId);
  if (!uuidValidation.success) {
    return apiErrors.validation('id', 'ID da atividade inválido');
  }

  if (!(await activityExists(activityId))) {
    return apiErrors.notFound('atividade', activityId);
  }

  const body = await request.json().catch(() => ({}));
  const rating = parseRating(body.rating);
  if (rating == null) {
    return apiErrors.validation('rating', 'A avaliação deve ser um número inteiro entre 1 e 5');
  }

  const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 2000) : '';

  const existing = await findOwnReview(activityId, session.user.id);

  const reviewId = existing
    ? existing.id
    : await insertReview({
        activityId,
        userId: session.user.id,
        rating,
        comment,
      });

  if (existing) {
    await updateReview({
      activityId,
      userId: session.user.id,
      rating,
      comment,
    });
  }

  const review = {
    id: reviewId,
    userId: session.user.id,
    userName: session.user.name || 'Utilizador',
    userEmail: session.user.email || '',
    rating,
    comment,
    createdAt: new Date().toISOString(),
    ...emptyDiscussionSummary(),
  };

  const status = existing ? 200 : 201;
  logApiResponse('POST', '/api/activities/[id]/ratings', status);
  return NextResponse.json({ review }, { status });
});

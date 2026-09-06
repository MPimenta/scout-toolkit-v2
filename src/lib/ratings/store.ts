import { and, asc, count, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import {
  activities,
  replyReactions,
  reviewReactions,
  reviewReplies,
  reviews,
  reviewVotes,
  user,
} from '../../../drizzle/schema';
import {
  emptyDiscussionSummary,
  emptyReactionCounts,
  nextReaction,
  nextVote,
  type DiscussionSummary,
  type PublicReply,
  type ReactionCounts,
  type ReactionKey,
  type VoteValue,
} from './index';

export type ReviewRow = {
  id: string;
  activity_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: Date;
  user_name: string | null;
  user_email: string | null;
};

export async function activityExists(activityId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: activities.id })
    .from(activities)
    .where(eq(activities.id, activityId))
    .limit(1);
  return Boolean(row);
}

export async function listActivityReviews(activityId: string): Promise<ReviewRow[]> {
  return db
    .select({
      id: reviews.id,
      activity_id: reviews.activity_id,
      user_id: reviews.user_id,
      rating: reviews.rating,
      comment: reviews.comment,
      created_at: reviews.created_at,
      user_name: user.name,
      user_email: user.email,
    })
    .from(reviews)
    .leftJoin(user, eq(reviews.user_id, user.id))
    .where(eq(reviews.activity_id, activityId))
    .orderBy(desc(reviews.created_at));
}

export async function findOwnReview(
  activityId: string,
  userId: string
): Promise<{ id: string; user_id: string } | undefined> {
  const [existing] = await db
    .select({ id: reviews.id, user_id: reviews.user_id })
    .from(reviews)
    .where(and(eq(reviews.activity_id, activityId), eq(reviews.user_id, userId)))
    .limit(1);
  return existing;
}

export async function findReviewById(
  reviewId: string,
  activityId: string
): Promise<{ id: string; activity_id: string } | undefined> {
  const [row] = await db
    .select({ id: reviews.id, activity_id: reviews.activity_id })
    .from(reviews)
    .where(and(eq(reviews.id, reviewId), eq(reviews.activity_id, activityId)))
    .limit(1);
  return row;
}

export async function insertReview(values: {
  activityId: string;
  userId: string;
  rating: number;
  comment: string;
}): Promise<string> {
  const [row] = await db
    .insert(reviews)
    .values({
      activity_id: values.activityId,
      user_id: values.userId,
      rating: values.rating,
      comment: values.comment,
    })
    .returning({ id: reviews.id });
  return row.id;
}

export async function updateReview(values: {
  activityId: string;
  userId: string;
  rating: number;
  comment: string;
}): Promise<void> {
  await db
    .update(reviews)
    .set({
      rating: values.rating,
      comment: values.comment,
      updated_at: new Date(),
    })
    .where(and(eq(reviews.activity_id, values.activityId), eq(reviews.user_id, values.userId)));
}

export async function listDiscussionSummaries(
  reviewIds: string[],
  viewerId?: string
): Promise<Record<string, DiscussionSummary>> {
  const summaries: Record<string, DiscussionSummary> = {};
  for (const id of reviewIds) {
    summaries[id] = emptyDiscussionSummary();
  }
  if (reviewIds.length === 0) {
    return summaries;
  }

  const votes = await db
    .select({
      review_id: reviewVotes.review_id,
      user_id: reviewVotes.user_id,
      value: reviewVotes.value,
    })
    .from(reviewVotes)
    .where(inArray(reviewVotes.review_id, reviewIds));

  for (const vote of votes) {
    const summary = summaries[vote.review_id];
    summary.score += vote.value === 'up' ? 1 : -1;
    if (viewerId && vote.user_id === viewerId) {
      summary.myVote = vote.value as VoteValue;
    }
  }

  const reactions = await db
    .select({
      review_id: reviewReactions.review_id,
      user_id: reviewReactions.user_id,
      key: reviewReactions.key,
    })
    .from(reviewReactions)
    .where(inArray(reviewReactions.review_id, reviewIds));

  for (const reaction of reactions) {
    const summary = summaries[reaction.review_id];
    const key = reaction.key as ReactionKey;
    summary.reactions[key] += 1;
    if (viewerId && reaction.user_id === viewerId) {
      summary.myReaction = key;
    }
  }

  const replyTotals = await db
    .select({
      review_id: reviewReplies.review_id,
      total: count(),
    })
    .from(reviewReplies)
    .where(inArray(reviewReplies.review_id, reviewIds))
    .groupBy(reviewReplies.review_id);

  for (const row of replyTotals) {
    summaries[row.review_id].replyCount = Number(row.total);
  }

  return summaries;
}

export async function getVote(reviewId: string, userId: string): Promise<VoteValue | null> {
  const [row] = await db
    .select({ value: reviewVotes.value })
    .from(reviewVotes)
    .where(and(eq(reviewVotes.review_id, reviewId), eq(reviewVotes.user_id, userId)))
    .limit(1);
  return (row?.value as VoteValue | undefined) ?? null;
}

export async function upsertVote(
  reviewId: string,
  userId: string,
  incoming: VoteValue
): Promise<VoteValue | null> {
  const next = nextVote(await getVote(reviewId, userId), incoming);
  await db
    .delete(reviewVotes)
    .where(and(eq(reviewVotes.review_id, reviewId), eq(reviewVotes.user_id, userId)));
  if (next) {
    await db.insert(reviewVotes).values({
      review_id: reviewId,
      user_id: userId,
      value: next,
    });
  }
  return next;
}

export async function getReviewReaction(
  reviewId: string,
  userId: string
): Promise<ReactionKey | null> {
  const [row] = await db
    .select({ key: reviewReactions.key })
    .from(reviewReactions)
    .where(and(eq(reviewReactions.review_id, reviewId), eq(reviewReactions.user_id, userId)))
    .limit(1);
  return (row?.key as ReactionKey | undefined) ?? null;
}

export async function upsertReviewReaction(
  reviewId: string,
  userId: string,
  incoming: ReactionKey
): Promise<ReactionKey | null> {
  const next = nextReaction(await getReviewReaction(reviewId, userId), incoming);
  await db
    .delete(reviewReactions)
    .where(and(eq(reviewReactions.review_id, reviewId), eq(reviewReactions.user_id, userId)));
  if (next) {
    await db.insert(reviewReactions).values({
      review_id: reviewId,
      user_id: userId,
      key: next,
    });
  }
  return next;
}

export async function findReply(
  replyId: string,
  reviewId: string
): Promise<{ id: string; user_id: string; review_id: string } | undefined> {
  const [row] = await db
    .select({
      id: reviewReplies.id,
      user_id: reviewReplies.user_id,
      review_id: reviewReplies.review_id,
    })
    .from(reviewReplies)
    .where(and(eq(reviewReplies.id, replyId), eq(reviewReplies.review_id, reviewId)))
    .limit(1);
  return row;
}

export async function getReplyReaction(
  replyId: string,
  userId: string
): Promise<ReactionKey | null> {
  const [row] = await db
    .select({ key: replyReactions.key })
    .from(replyReactions)
    .where(and(eq(replyReactions.reply_id, replyId), eq(replyReactions.user_id, userId)))
    .limit(1);
  return (row?.key as ReactionKey | undefined) ?? null;
}

export async function upsertReplyReaction(
  replyId: string,
  userId: string,
  incoming: ReactionKey
): Promise<ReactionKey | null> {
  const next = nextReaction(await getReplyReaction(replyId, userId), incoming);
  await db
    .delete(replyReactions)
    .where(and(eq(replyReactions.reply_id, replyId), eq(replyReactions.user_id, userId)));
  if (next) {
    await db.insert(replyReactions).values({
      reply_id: replyId,
      user_id: userId,
      key: next,
    });
  }
  return next;
}

export async function listReplies(
  reviewId: string,
  viewerId?: string
): Promise<PublicReply[]> {
  const rows = await db
    .select({
      id: reviewReplies.id,
      review_id: reviewReplies.review_id,
      user_id: reviewReplies.user_id,
      body: reviewReplies.body,
      mention_user_id: reviewReplies.mention_user_id,
      created_at: reviewReplies.created_at,
      user_name: user.name,
    })
    .from(reviewReplies)
    .leftJoin(user, eq(reviewReplies.user_id, user.id))
    .where(eq(reviewReplies.review_id, reviewId))
    .orderBy(asc(reviewReplies.created_at));

  const ids = rows.map((row) => row.id);
  const reactionRows = ids.length
    ? await db
        .select({
          reply_id: replyReactions.reply_id,
          user_id: replyReactions.user_id,
          key: replyReactions.key,
        })
        .from(replyReactions)
        .where(inArray(replyReactions.reply_id, ids))
    : [];

  const reactionsByReply = new Map<string, { counts: ReactionCounts; mine: ReactionKey | null }>();
  for (const id of ids) {
    reactionsByReply.set(id, { counts: emptyReactionCounts(), mine: null });
  }
  for (const reaction of reactionRows) {
    const bucket = reactionsByReply.get(reaction.reply_id);
    if (!bucket) continue;
    const key = reaction.key as ReactionKey;
    bucket.counts[key] += 1;
    if (viewerId && reaction.user_id === viewerId) {
      bucket.mine = key;
    }
  }

  return rows.map((row) => {
    const bucket = reactionsByReply.get(row.id) ?? {
      counts: emptyReactionCounts(),
      mine: null,
    };
    return {
      id: row.id,
      reviewId: row.review_id,
      userId: row.user_id,
      userName: row.user_name || 'Utilizador',
      body: row.body,
      mentionUserId: row.mention_user_id,
      createdAt: row.created_at.toISOString(),
      reactions: bucket.counts,
      myReaction: bucket.mine,
    };
  });
}

export async function insertReply(values: {
  reviewId: string;
  userId: string;
  body: string;
  mentionUserId?: string | null;
}): Promise<string> {
  const [row] = await db
    .insert(reviewReplies)
    .values({
      review_id: values.reviewId,
      user_id: values.userId,
      body: values.body,
      mention_user_id: values.mentionUserId ?? null,
    })
    .returning({ id: reviewReplies.id });
  return row.id;
}

export async function updateReply(values: {
  replyId: string;
  reviewId: string;
  body: string;
}): Promise<void> {
  await db
    .update(reviewReplies)
    .set({
      body: values.body,
      updated_at: new Date(),
    })
    .where(and(eq(reviewReplies.id, values.replyId), eq(reviewReplies.review_id, values.reviewId)));
}

export async function deleteReply(replyId: string, reviewId: string): Promise<void> {
  await db
    .delete(reviewReplies)
    .where(and(eq(reviewReplies.id, replyId), eq(reviewReplies.review_id, reviewId)));
}

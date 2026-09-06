export const REACTION_KEYS = ['gosto', 'adorei', 'haha', 'wow', 'triste'] as const;
export const VOTE_VALUES = ['up', 'down'] as const;

export type ReactionKey = (typeof REACTION_KEYS)[number];
export type VoteValue = (typeof VOTE_VALUES)[number];

export type ReactionCounts = Record<ReactionKey, number>;

export function parseRating(value: unknown): number | null {
  const rating = typeof value === 'string' ? Number(value) : value;
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return null;
  }
  return rating;
}

export function computeAverage(ratings: number[]): { average: number; count: number } {
  if (ratings.length === 0) {
    return { average: 0, count: 0 };
  }
  const sum = ratings.reduce((total, rating) => total + rating, 0);
  return {
    average: Math.round((sum / ratings.length) * 10) / 10,
    count: ratings.length,
  };
}

export function emptyReactionCounts(): ReactionCounts {
  return { gosto: 0, adorei: 0, haha: 0, wow: 0, triste: 0 };
}

export function parseVote(value: unknown): VoteValue | null {
  return value === 'up' || value === 'down' ? value : null;
}

export function parseReactionKey(value: unknown): ReactionKey | null {
  return typeof value === 'string' && (REACTION_KEYS as readonly string[]).includes(value)
    ? (value as ReactionKey)
    : null;
}

export function parseReplyBody(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const body = value.trim();
  if (body.length === 0 || body.length > 2000) {
    return null;
  }
  return body;
}

export function nextVote(current: VoteValue | null, incoming: VoteValue): VoteValue | null {
  return current === incoming ? null : incoming;
}

export function nextReaction(
  current: ReactionKey | null,
  incoming: ReactionKey
): ReactionKey | null {
  return current === incoming ? null : incoming;
}

export function computeVoteScore(votes: VoteValue[]): number {
  return votes.reduce((score, vote) => score + (vote === 'up' ? 1 : -1), 0);
}

export function mentionPrefix(name: string): string {
  const cleaned = name.trim();
  return cleaned ? `@${cleaned} ` : '';
}

export type PublicReview = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  createdAt: string;
  score: number;
  myVote: VoteValue | null;
  reactions: ReactionCounts;
  myReaction: ReactionKey | null;
  replyCount: number;
};

export type DiscussionSummary = {
  score: number;
  myVote: VoteValue | null;
  reactions: ReactionCounts;
  myReaction: ReactionKey | null;
  replyCount: number;
};

export function emptyDiscussionSummary(): DiscussionSummary {
  return {
    score: 0,
    myVote: null,
    reactions: emptyReactionCounts(),
    myReaction: null,
    replyCount: 0,
  };
}

export function toPublicReview(row: {
  id: string;
  activity_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: Date;
  user_name: string | null;
  user_email: string | null;
  score?: number;
  my_vote?: VoteValue | null;
  reactions?: ReactionCounts;
  my_reaction?: ReactionKey | null;
  reply_count?: number;
}): PublicReview {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name || 'Utilizador',
    userEmail: row.user_email || '',
    rating: row.rating,
    comment: row.comment || '',
    createdAt: row.created_at.toISOString(),
    score: row.score ?? 0,
    myVote: row.my_vote ?? null,
    reactions: row.reactions ?? emptyReactionCounts(),
    myReaction: row.my_reaction ?? null,
    replyCount: row.reply_count ?? 0,
  };
}

export type PublicReply = {
  id: string;
  reviewId: string;
  userId: string;
  userName: string;
  body: string;
  mentionUserId: string | null;
  createdAt: string;
  reactions: ReactionCounts;
  myReaction: ReactionKey | null;
};

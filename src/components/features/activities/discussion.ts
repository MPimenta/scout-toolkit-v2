import type { PublicReply, PublicReview, ReactionKey } from '@/lib/ratings';
import { emptyDiscussionSummary } from '@/lib/ratings';

export const REACTION_LABELS: { key: ReactionKey; emoji: string; label: string }[] = [
  { key: 'gosto', emoji: '👍', label: 'Gosto' },
  { key: 'adorei', emoji: '❤️', label: 'Adorei' },
  { key: 'haha', emoji: '😄', label: 'Haha' },
  { key: 'wow', emoji: '😮', label: 'Wow' },
  { key: 'triste', emoji: '😢', label: 'Triste' },
];

export type ReviewPost = PublicReview;

export function withDiscussionDefaults(review: Partial<PublicReview> & Pick<
  PublicReview,
  'id' | 'userId' | 'userName' | 'userEmail' | 'rating' | 'comment' | 'createdAt'
>): ReviewPost {
  return {
    ...emptyDiscussionSummary(),
    ...review,
    reactions: review.reactions ?? emptyDiscussionSummary().reactions,
  };
}

export type ReplyPost = PublicReply;

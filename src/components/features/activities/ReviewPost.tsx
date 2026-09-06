'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, MessageSquare, Star } from 'lucide-react';
import type { PublicReply, ReactionKey, VoteValue } from '@/lib/ratings';
import { ReactionPicker } from './ReactionPicker';
import { ReplyThread } from './ReplyThread';
import type { ReviewPost as ReviewPostType } from './discussion';

interface ReviewPostProps {
  review: ReviewPostType;
  currentUserId?: string;
  canWrite: boolean;
  onVote: (reviewId: string, value: VoteValue) => Promise<void>;
  onReact: (reviewId: string, key: ReactionKey) => Promise<void>;
  onReplyReact: (reviewId: string, replyId: string, key: ReactionKey) => Promise<void>;
  onReply: (reviewId: string, body: string, mentionUserId?: string | null) => Promise<void>;
  onEditReply: (reviewId: string, replyId: string, body: string) => Promise<void>;
  onDeleteReply: (reviewId: string, replyId: string) => Promise<void>;
  loadReplies: (reviewId: string) => Promise<PublicReply[]>;
}

export function ReviewPost({
  review,
  currentUserId,
  canWrite,
  onVote,
  onReact,
  onReplyReact,
  onReply,
  onEditReply,
  onDeleteReply,
  loadReplies,
}: ReviewPostProps) {
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState<PublicReply[] | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const toggleThread = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && replies == null) {
      setReplies(await loadReplies(review.id));
    }
  };

  const renderStars = (value: number) =>
    Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src="" alt={review.userName} />
            <AvatarFallback>{review.userName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="font-medium text-foreground">{review.userName}</span>
              <span className="text-sm text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString('pt-PT')}
              </span>
            </div>
            <div className="mb-2 flex gap-1">{renderStars(review.rating)}</div>
            {review.comment && <p className="text-muted-foreground">{review.comment}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!canWrite}
              aria-label="Voto positivo"
              aria-pressed={review.myVote === 'up'}
              onClick={() => onVote(review.id, 'up')}
              className={`rounded p-1 ${review.myVote === 'up' ? 'text-secondary' : 'text-muted-foreground'} ${
                canWrite ? 'hover:text-secondary' : 'cursor-default'
              }`}
            >
              <ChevronUp className="h-5 w-5" />
            </button>
            <span className="min-w-6 text-center text-sm font-medium">{review.score}</span>
            <button
              type="button"
              disabled={!canWrite}
              aria-label="Voto negativo"
              aria-pressed={review.myVote === 'down'}
              onClick={() => onVote(review.id, 'down')}
              className={`rounded p-1 ${review.myVote === 'down' ? 'text-secondary' : 'text-muted-foreground'} ${
                canWrite ? 'hover:text-secondary' : 'cursor-default'
              }`}
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          <ReactionPicker
            reactions={review.reactions}
            myReaction={review.myReaction}
            canWrite={canWrite}
            onReact={(key) => onReact(review.id, key)}
          />
        </div>

        <button
          type="button"
          onClick={toggleThread}
          className="inline-flex items-center gap-2 text-sm text-secondary hover:underline"
        >
          <MessageSquare className="h-4 w-4" />
          {review.replyCount === 1
            ? '1 resposta'
            : `${review.replyCount} respostas`}
        </button>

        {expanded && (
          <ReplyThread
            replies={replies ?? []}
            currentUserId={currentUserId}
            canWrite={canWrite}
            isPosting={isPosting}
            onReply={async (body, mentionUserId) => {
              setIsPosting(true);
              try {
                await onReply(review.id, body, mentionUserId);
                setReplies(await loadReplies(review.id));
              } finally {
                setIsPosting(false);
              }
            }}
            onEdit={async (replyId, body) => {
              await onEditReply(review.id, replyId, body);
              setReplies(await loadReplies(review.id));
            }}
            onDelete={async (replyId) => {
              await onDeleteReply(review.id, replyId);
              setReplies(await loadReplies(review.id));
            }}
            onReact={async (replyId, key) => {
              await onReplyReact(review.id, replyId, key);
              setReplies(await loadReplies(review.id));
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

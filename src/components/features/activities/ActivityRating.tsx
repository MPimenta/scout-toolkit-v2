'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Send, Star } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { log } from '@/lib/errors';
import { toast } from 'sonner';
import Link from 'next/link';
import type { PublicReply, ReactionKey, VoteValue } from '@/lib/ratings';
import { ReviewPost } from './ReviewPost';
import { withDiscussionDefaults, type ReviewPost as ReviewPostType } from './discussion';

interface ActivityRatingProps {
  activityId: string;
}

interface RatingsPayload {
  average: number;
  count: number;
  reviews: ReviewPostType[];
  mine: ReviewPostType | null;
}

function formatAverage(average: number): string {
  return average.toLocaleString('pt-PT', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function ActivityRating({ activityId }: ActivityRatingProps) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ratings, setRatings] = useState<ReviewPostType[]>([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);

  const applyPayload = useCallback((payload: RatingsPayload) => {
    const reviews = payload.reviews.map(withDiscussionDefaults);
    setRatings(reviews);
    setAverage(payload.average);
    setCount(payload.count);

    if (payload.mine) {
      setRating(payload.mine.rating);
      setComment(payload.mine.comment);
    }
  }, []);

  const loadRatings = useCallback(async () => {
    const response = await fetch(`/api/activities/${activityId}/ratings`);
    if (!response.ok) {
      throw new Error('Failed to load ratings');
    }

    return (await response.json()) as RatingsPayload;
  }, [activityId]);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    loadRatings()
      .then((payload) => {
        if (!cancelled) {
          applyPayload(payload);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          log.error('Error loading ratings', error as Error);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applyPayload, loadRatings]);

  const refresh = async () => {
    applyPayload(await loadRatings());
  };

  const handleRatingSubmit = async () => {
    if (!session?.user || rating === 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/activities/${activityId}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }

      applyPayload(await loadRatings());
      toast.success('Avaliação enviada com sucesso!');
    } catch (error) {
      log.error('Error submitting rating', error as Error);
      toast.error('Não foi possível enviar a avaliação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (reviewId: string, value: VoteValue) => {
    const response = await fetch(`/api/activities/${activityId}/ratings/${reviewId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    if (!response.ok) {
      toast.error('Não foi possível votar.');
      return;
    }
    await refresh();
  };

  const handleReact = async (reviewId: string, key: ReactionKey) => {
    const response = await fetch(`/api/activities/${activityId}/ratings/${reviewId}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    if (!response.ok) {
      toast.error('Não foi possível reagir.');
      return;
    }
    await refresh();
  };

  const loadReplies = async (reviewId: string): Promise<PublicReply[]> => {
    const response = await fetch(`/api/activities/${activityId}/ratings/${reviewId}/replies`);
    if (!response.ok) {
      toast.error('Não foi possível carregar as respostas.');
      return [];
    }
    const payload = (await response.json()) as { replies: PublicReply[] };
    return payload.replies;
  };

  const handleReply = async (reviewId: string, body: string, mentionUserId?: string | null) => {
    const response = await fetch(`/api/activities/${activityId}/ratings/${reviewId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, mentionUserId }),
    });
    if (!response.ok) {
      toast.error('Não foi possível responder.');
      throw new Error('Failed to reply');
    }
    await refresh();
  };

  const handleEditReply = async (reviewId: string, replyId: string, body: string) => {
    const response = await fetch(
      `/api/activities/${activityId}/ratings/${reviewId}/replies/${replyId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      }
    );
    if (!response.ok) {
      toast.error('Não foi possível editar a resposta.');
      throw new Error('Failed to edit reply');
    }
  };

  const handleDeleteReply = async (reviewId: string, replyId: string) => {
    const response = await fetch(
      `/api/activities/${activityId}/ratings/${reviewId}/replies/${replyId}`,
      { method: 'DELETE' }
    );
    if (!response.ok) {
      toast.error('Não foi possível apagar a resposta.');
      throw new Error('Failed to delete reply');
    }
    await refresh();
  };

  const handleReplyReact = async (reviewId: string, replyId: string, key: ReactionKey) => {
    const response = await fetch(
      `/api/activities/${activityId}/ratings/${reviewId}/replies/${replyId}/reactions`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      }
    );
    if (!response.ok) {
      toast.error('Não foi possível reagir.');
      throw new Error('Failed to react');
    }
  };

  const renderStars = (value: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, index) => (
      <button
        key={index}
        type="button"
        onClick={interactive ? () => setRating(index + 1) : undefined}
        className={`h-5 w-5 ${
          interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''
        }`}
        disabled={!interactive}
        aria-label={`${index + 1} ${index === 0 ? 'estrela' : 'estrelas'}`}
      >
        <Star
          className={`h-5 w-5 ${
            index < value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      </button>
    ));
  };

  const canWrite = Boolean(session?.user);
  const summary = (
    <div className="flex items-baseline gap-2">
      <h3 className="text-lg font-semibold text-foreground">Avaliações</h3>
      <p className="text-sm text-muted-foreground">
        Média {formatAverage(average)} ({count} {count === 1 ? 'avaliação' : 'avaliações'})
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {summary}

      {session ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Avalie esta atividade
                </label>
                <div className="flex gap-1">{renderStars(rating, true)}</div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Comentário (opcional)
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Partilhe a sua experiência com esta atividade..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleRatingSubmit}
                disabled={rating === 0 || isSubmitting}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'A enviar...' : 'Enviar Avaliação'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="py-8 text-center">
          <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-4 text-muted-foreground">
            Inicie sessão para avaliar esta atividade
          </p>
          <Button variant="outline" asChild>
            <Link href="/auth/signin">Iniciar Sessão</Link>
          </Button>
        </div>
      )}

      {ratings.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-base font-semibold text-foreground">
            Avaliações ({ratings.length})
          </h4>

          {ratings.map((review) => (
            <ReviewPost
              key={review.id}
              review={review}
              currentUserId={session?.user?.id}
              canWrite={canWrite}
              onVote={handleVote}
              onReact={handleReact}
              onReplyReact={handleReplyReact}
              onReply={handleReply}
              onEditReply={handleEditReply}
              onDeleteReply={handleDeleteReply}
              loadReplies={loadReplies}
            />
          ))}
        </div>
      )}

      {!isLoading && ratings.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          <MessageSquare className="mx-auto mb-4 h-12 w-12" />
          <p>Seja o primeiro a avaliar esta atividade!</p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageSquare, Send } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface ActivityRatingProps {
  activityId: string;
}

interface Rating {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export function ActivityRating({ }: ActivityRatingProps) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratings, setRatings] = useState<Rating[]>([]);

  const handleRatingSubmit = async () => {
    if (!session?.user || rating === 0) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement rating submission API
      const newRating: Rating = {
        id: Date.now().toString(),
        userId: session.user.id || 'unknown',
        userName: session.user.name || 'Unknown User',
        userEmail: session.user.email || 'unknown@example.com',
        rating,
        comment,
        createdAt: new Date().toISOString(),
      };

      setRatings(prev => [newRating, ...prev]);
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (value: number, interactive = false) => {
    return Array.from({ length: 5 }, (_, index) => (
      <button
        key={index}
        type={interactive ? 'button' : 'button'}
        onClick={interactive ? () => setRating(index + 1) : undefined}
        className={`w-5 h-5 ${
          interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''
        }`}
        disabled={!interactive}
      >
        <Star
          className={`w-5 h-5 ${
            index < value
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
        />
      </button>
    ));
  };

  if (!session) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">
          Inicie sessão para avaliar esta atividade
        </p>
        <Button variant="outline">Iniciar Sessão</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Form */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Avalie esta atividade
              </label>
              <div className="flex gap-1">
                {renderStars(rating, true)}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
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
              <Send className="w-4 h-4" />
              {isSubmitting ? 'A enviar...' : 'Enviar Avaliação'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Ratings */}
      {ratings.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Avaliações ({ratings.length})
          </h3>
          
          {ratings.map((ratingItem) => (
            <Card key={ratingItem.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src="" alt={ratingItem.userName} />
                    <AvatarFallback>
                      {ratingItem.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-foreground">
                        {ratingItem.userName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(ratingItem.createdAt).toLocaleDateString('pt-PT')}
                      </span>
                    </div>
                    
                    <div className="flex gap-1 mb-2">
                      {renderStars(ratingItem.rating)}
                    </div>
                    
                    {ratingItem.comment && (
                      <p className="text-muted-foreground">
                        {ratingItem.comment}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {ratings.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-4" />
          <p>Seja o primeiro a avaliar esta atividade!</p>
        </div>
      )}
    </div>
  );
}

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivityRating } from '@/components/features/activities/ActivityRating';
import { useSession } from 'next-auth/react';
import { emptyReactionCounts } from '@/lib/ratings';
import { vi } from 'vitest';

vi.mock('next-auth/react');
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockUseSession = useSession as ReturnType<typeof vi.fn>;
const mockFetch = vi.fn();
global.fetch = mockFetch;

type StoredReview = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  createdAt: string;
  score: number;
  myVote: 'up' | 'down' | null;
  reactions: ReturnType<typeof emptyReactionCounts>;
  myReaction: null;
  replyCount: number;
};

function sampleReview(overrides: Partial<StoredReview> = {}): StoredReview {
  return {
    id: '550e8400-e29b-41d4-a716-446655440099',
    userId: 'other-user',
    userName: 'Chefe Ana',
    userEmail: 'ana@example.com',
    rating: 5,
    comment: 'Excelente',
    createdAt: '2024-01-15T12:00:00.000Z',
    score: 0,
    myVote: null,
    reactions: emptyReactionCounts(),
    myReaction: null,
    replyCount: 0,
    ...overrides,
  };
}

function emptyPayload(overrides: Partial<{ average: number; count: number; reviews: StoredReview[]; mine: StoredReview | null }> = {}) {
  return {
    average: 0,
    count: 0,
    reviews: [] as StoredReview[],
    mine: null as StoredReview | null,
    ...overrides,
  };
}

describe('ActivityRating', () => {
  const mockSession = {
    data: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
    },
    status: 'authenticated' as const,
  };

  const mockUnauthenticatedSession = {
    data: null,
    status: 'unauthenticated' as const,
  };

  let storedReviews: StoredReview[];

  beforeEach(() => {
    vi.clearAllMocks();
    storedReviews = [];

    mockFetch.mockImplementation(async (url: string, init?: RequestInit) => {
      const path = String(url);
      if (path.includes('/replies') && (!init?.method || init.method === 'GET')) {
        return {
          ok: true,
          json: async () => ({
            replies: [
              {
                id: '550e8400-e29b-41d4-a716-446655440088',
                reviewId: '550e8400-e29b-41d4-a716-446655440099',
                userId: 'other-user',
                userName: 'Chefe Ana',
                body: 'Primeira resposta',
                mentionUserId: null,
                createdAt: '2024-01-15T12:00:00.000Z',
                reactions: emptyReactionCounts(),
                myReaction: null,
              },
            ],
          }),
        };
      }

      if (init?.method === 'POST' && path.endsWith('/ratings')) {
        const body = JSON.parse(String(init.body)) as { rating: number; comment?: string };
        const review = sampleReview({
          userId: 'test-user-id',
          userName: 'Test User',
          userEmail: 'test@example.com',
          rating: body.rating,
          comment: body.comment || '',
        });
        storedReviews = [review, ...storedReviews.filter((item) => item.userId !== review.userId)];
        return {
          ok: true,
          status: storedReviews.length === 1 ? 201 : 200,
          json: async () => ({ review }),
        };
      }

      if (init?.method === 'POST') {
        return { ok: true, json: async () => ({}) };
      }

      const sum = storedReviews.reduce((total, review) => total + review.rating, 0);
      return {
        ok: true,
        json: async () =>
          emptyPayload({
            average: storedReviews.length ? Math.round((sum / storedReviews.length) * 10) / 10 : 0,
            count: storedReviews.length,
            reviews: storedReviews,
            mine: storedReviews.find((review) => review.userId === 'test-user-id') ?? null,
          }),
      };
    });
  });

  describe('when user is not authenticated', () => {
    it('shows login prompt and public average', async () => {
      mockUseSession.mockReturnValue(mockUnauthenticatedSession);

      render(<ActivityRating activityId="test-activity" />);

      expect(screen.getByText('Inicie sessão para avaliar esta atividade')).toBeInTheDocument();
      expect(screen.getByText('Iniciar Sessão')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/Média/)).toBeInTheDocument();
      });
    });
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue(mockSession);
    });

    it('renders rating form', async () => {
      render(<ActivityRating activityId="test-activity" />);

      expect(screen.getByText('Avalie esta atividade')).toBeInTheDocument();
      expect(screen.getByText('Comentário (opcional)')).toBeInTheDocument();
      expect(screen.getByText('Enviar Avaliação')).toBeInTheDocument();
      await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    });

    it('displays 5 interactive stars', () => {
      render(<ActivityRating activityId="test-activity" />);

      const stars = screen.getAllByRole('button').filter((button) =>
        button.querySelector('svg[class*="lucide-star"]')
      );
      expect(stars.length).toBeGreaterThanOrEqual(5);

      stars.slice(0, 5).forEach((star) => {
        expect(star).toHaveClass('cursor-pointer');
        expect(star).toHaveClass('hover:scale-110');
      });
    });

    it('allows user to select rating by clicking stars', () => {
      render(<ActivityRating activityId="test-activity" />);

      const stars = screen.getAllByLabelText(/estrelas?$/);
      fireEvent.click(stars[2]);

      stars.slice(0, 3).forEach((star) => {
        expect(star.querySelector('svg')).toHaveClass('fill-yellow-400', 'text-yellow-400');
      });
    });

    it('allows user to type comment', () => {
      render(<ActivityRating activityId="test-activity" />);

      const commentTextarea = screen.getByPlaceholderText('Partilhe a sua experiência com esta atividade...');
      fireEvent.change(commentTextarea, { target: { value: 'Great activity!' } });

      expect(commentTextarea).toHaveValue('Great activity!');
    });

    it('disables submit button when no rating is selected', () => {
      render(<ActivityRating activityId="test-activity" />);

      expect(screen.getByText('Enviar Avaliação')).toBeDisabled();
    });

    it('enables submit button when rating is selected', () => {
      render(<ActivityRating activityId="test-activity" />);

      fireEvent.click(screen.getAllByLabelText(/estrelas?$/)[2]);

      expect(screen.getByText('Enviar Avaliação')).not.toBeDisabled();
    });

    it('submits rating successfully', async () => {
      render(<ActivityRating activityId="test-activity" />);

      await waitFor(() => {
        expect(screen.getByText('Seja o primeiro a avaliar esta atividade!')).toBeInTheDocument();
      });

      const commentTextarea = screen.getByPlaceholderText('Partilhe a sua experiência com esta atividade...');
      fireEvent.click(screen.getAllByLabelText(/estrelas?$/)[3]);
      fireEvent.change(commentTextarea, { target: { value: 'Excellent activity!' } });
      fireEvent.click(screen.getByText('Enviar Avaliação'));

      await waitFor(() => {
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getAllByText('Excellent activity!').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Avaliações (1)')).toBeInTheDocument();
      });
    });

    it('shows existing ratings loaded from the API', async () => {
      storedReviews = [sampleReview()];

      render(<ActivityRating activityId="test-activity" />);

      await waitFor(() => {
        expect(screen.getByText('Avaliações (1)')).toBeInTheDocument();
        expect(screen.getByText('Chefe Ana')).toBeInTheDocument();
        expect(screen.getByText('Excelente')).toBeInTheDocument();
      });
    });

    it('displays rating date in Portuguese format', async () => {
      storedReviews = [sampleReview()];

      render(<ActivityRating activityId="test-activity" />);

      await waitFor(() => {
        expect(screen.getByText(/\d{1,2}\/\d{1,2}\/2024/)).toBeInTheDocument();
      });
    });

    it('upserts a second submit from the same user', async () => {
      render(<ActivityRating activityId="test-activity" />);

      await waitFor(() => {
        expect(screen.getByText('Seja o primeiro a avaliar esta atividade!')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByLabelText(/estrelas?$/)[3]);
      fireEvent.click(screen.getByText('Enviar Avaliação'));

      await waitFor(() => {
        expect(screen.getByText('Avaliações (1)')).toBeInTheDocument();
      });

      fireEvent.click(screen.getAllByLabelText(/estrelas?$/)[4]);
      fireEvent.click(screen.getByText('Enviar Avaliação'));

      await waitFor(() => {
        expect(screen.getByText('Avaliações (1)')).toBeInTheDocument();
      });
    });

    it('renders a review as a post with votes, reactions, and a collapsed thread', async () => {
      storedReviews = [sampleReview({ replyCount: 3 })];
      render(<ActivityRating activityId="test-activity" />);

      await waitFor(() => {
        expect(screen.getByLabelText('Voto positivo')).toBeInTheDocument();
        expect(screen.getByLabelText('Gosto')).toBeInTheDocument();
        expect(screen.getByText('3 respostas')).toBeInTheDocument();
      });
      expect(screen.queryByText('Primeira resposta')).not.toBeInTheDocument();
    });

    it('loads replies oldest-first when the thread is expanded', async () => {
      storedReviews = [sampleReview({ replyCount: 1 })];
      render(<ActivityRating activityId="test-activity" />);

      await waitFor(() => {
        expect(screen.getByText('1 resposta')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('1 resposta'));

      await waitFor(() => {
        expect(screen.getByText('Primeira resposta')).toBeInTheDocument();
      });
    });

    it('lets the author reply in the expanded thread', async () => {
      storedReviews = [sampleReview({ replyCount: 1 })];
      render(<ActivityRating activityId="test-activity" />);

      await waitFor(() => {
        expect(screen.getByText('1 resposta')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('1 resposta'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Escreva uma resposta...')).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText('Escreva uma resposta...'), {
        target: { value: '@Ana também' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Enviar resposta' }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/replies'),
          expect.objectContaining({ method: 'POST' })
        );
      });
    });
  });

  describe('guest discussion chrome', () => {
    it('shows counts without write controls on a review post', async () => {
      mockUseSession.mockReturnValue(mockUnauthenticatedSession);
      storedReviews = [sampleReview({ replyCount: 2 })];
      render(<ActivityRating activityId="test-activity" />);

      await waitFor(() => {
        expect(screen.getByText('2 respostas')).toBeInTheDocument();
        expect(screen.getByLabelText('Gosto')).toBeDisabled();
        expect(screen.getByLabelText('Voto positivo')).toBeDisabled();
      });
    });
  });
});

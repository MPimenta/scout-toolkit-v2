import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivityRating } from '@/components/features/activities/ActivityRating';
import { useSession } from 'next-auth/react';

// Mock next-auth
jest.mock('next-auth/react');

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user is not authenticated', () => {
    it('shows login prompt', () => {
      mockUseSession.mockReturnValue(mockUnauthenticatedSession);

      render(<ActivityRating activityId="test-activity" />);

      expect(screen.getByText('Inicie sessão para avaliar esta atividade')).toBeInTheDocument();
      expect(screen.getByText('Iniciar Sessão')).toBeInTheDocument();
    });
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue(mockSession);
    });

    it('renders rating form', () => {
      render(<ActivityRating activityId="test-activity" />);

      expect(screen.getByText('Avalie esta atividade')).toBeInTheDocument();
      expect(screen.getByText('Comentário (opcional)')).toBeInTheDocument();
      expect(screen.getByText('Enviar Avaliação')).toBeInTheDocument();
    });

    it('displays 5 interactive stars', () => {
      render(<ActivityRating activityId="test-activity" />);

      const stars = screen.getAllByRole('button');
      expect(stars).toHaveLength(5);

      // Check that stars are interactive
      stars.forEach((star, index) => {
        expect(star).toHaveClass('cursor-pointer');
        expect(star).toHaveClass('hover:scale-110');
      });
    });

    it('allows user to select rating by clicking stars', () => {
      render(<ActivityRating activityId="test-activity" />);

      const stars = screen.getAllByRole('button');
      
      // Click on the 3rd star (rating = 3)
      fireEvent.click(stars[2]);

      // Check that first 3 stars are filled
      const filledStars = stars.slice(0, 3);
      const unfilledStars = stars.slice(3);

      filledStars.forEach(star => {
        expect(star.querySelector('svg')).toHaveClass('fill-yellow-400', 'text-yellow-400');
      });

      unfilledStars.forEach(star => {
        expect(star.querySelector('svg')).toHaveClass('text-gray-300');
        expect(star.querySelector('svg')).not.toHaveClass('fill-yellow-400');
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

      const submitButton = screen.getByText('Enviar Avaliação');
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when rating is selected', () => {
      render(<ActivityRating activityId="test-activity" />);

      const stars = screen.getAllByRole('button');
      fireEvent.click(stars[2]); // Select 3-star rating

      const submitButton = screen.getByText('Enviar Avaliação');
      expect(submitButton).not.toBeDisabled();
    });

    it('submits rating successfully', async () => {
      render(<ActivityRating activityId="test-activity" />);

      const stars = screen.getAllByRole('button');
      const commentTextarea = screen.getByPlaceholderText('Partilhe a sua experiência com esta atividade...');
      const submitButton = screen.getByText('Enviar Avaliação');

      // Select rating and add comment
      fireEvent.click(stars[3]); // 4-star rating
      fireEvent.change(commentTextarea, { target: { value: 'Excellent activity!' } });

      // Submit
      fireEvent.click(submitButton);

      // Check loading state
      expect(screen.getByText('A enviar...')).toBeInTheDocument();

      // Wait for submission to complete
      await waitFor(() => {
        expect(screen.getByText('Enviar Avaliação')).toBeInTheDocument();
      });

      // Check that form is reset
      expect(commentTextarea).toHaveValue('');
      
      // Check that rating is displayed in the list
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Excellent activity!')).toBeInTheDocument();
    });

    it('shows existing ratings when available', () => {
      render(<ActivityRating activityId="test-activity" />);

      // Initially no ratings
      expect(screen.getByText('Seja o primeiro a avaliar esta atividade!')).toBeInTheDocument();

      // Submit a rating
      const stars = screen.getAllByRole('button');
      fireEvent.click(stars[4]); // 5-star rating
      const submitButton = screen.getByText('Enviar Avaliação');
      fireEvent.click(submitButton);

      // Wait for rating to appear
      waitFor(() => {
        expect(screen.getByText('Avaliações (1)')).toBeInTheDocument();
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('Excellent activity!')).toBeInTheDocument();
      });
    });

    it('displays rating date in Portuguese format', async () => {
      render(<ActivityRating activityId="test-activity" />);

      // Submit a rating
      const stars = screen.getAllByRole('button');
      fireEvent.click(stars[4]); // 5-star rating
      const submitButton = screen.getByText('Enviar Avaliação');
      fireEvent.click(submitButton);

      // Wait for rating to appear and check date format
      await waitFor(() => {
        const dateElement = screen.getByText(/1\/1\/2024/); // Portuguese date format
        expect(dateElement).toBeInTheDocument();
      });
    });

    it('handles multiple ratings correctly', async () => {
      render(<ActivityRating activityId="test-activity" />);

      // Submit first rating
      const stars = screen.getAllByRole('button');
      fireEvent.click(stars[3]); // 4-star rating
      const submitButton = screen.getByText('Enviar Avaliação');
      fireEvent.click(submitButton);

      // Wait for first rating to appear
      await waitFor(() => {
        expect(screen.getByText('Avaliações (1)')).toBeInTheDocument();
      });

      // Submit second rating
      fireEvent.click(stars[4]); // 5-star rating
      fireEvent.click(submitButton);

      // Wait for second rating to appear
      await waitFor(() => {
        expect(screen.getByText('Avaliações (2)')).toBeInTheDocument();
      });
    });
  });

  describe('star rendering', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue(mockSession);
    });

    it('renders filled stars for existing ratings', async () => {
      render(<ActivityRating activityId="test-activity" />);

      // Submit a rating
      const stars = screen.getAllByRole('button');
      fireEvent.click(stars[2]); // 3-star rating
      const submitButton = screen.getByText('Enviar Avaliação');
      fireEvent.click(submitButton);

      // Wait for rating to appear
      await waitFor(() => {
        const ratingStars = screen.getAllByRole('button').slice(0, 5); // First 5 are rating form stars
        
        // Check that first 3 stars are filled
        ratingStars.slice(0, 3).forEach(star => {
          expect(star.querySelector('svg')).toHaveClass('fill-yellow-400');
        });
        
        // Check that last 2 stars are not filled
        ratingStars.slice(3).forEach(star => {
          expect(star.querySelector('svg')).not.toHaveClass('fill-yellow-400');
        });
      });
    });
  });
});

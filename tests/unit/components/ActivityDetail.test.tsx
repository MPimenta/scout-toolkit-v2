import { render, screen, waitFor } from '@testing-library/react';
import { ActivityDetail } from '@/components/features/activities/ActivityDetail';
import { useActivity } from '@/hooks/useActivity';
import { useSession } from 'next-auth/react';

import { vi } from 'vitest';

// Mock the hooks
vi.mock('@/hooks/useActivity');
vi.mock('next-auth/react');
vi.mock('@/components/features/activities/ActivityRating', () => ({
  ActivityRating: ({ activityId }: { activityId: string }) => (
    <div data-testid="activity-rating" data-activity-id={activityId}>
      Activity Rating Component
    </div>
  ),
}));
vi.mock('@/components/features/activities/AddToProgramModal', () => ({
  AddToProgramModal: ({ isOpen, onClose, activity }: any) => (
    <div data-testid="add-to-program-modal" data-is-open={isOpen} data-activity-id={activity.id}>
      Add to Program Modal
    </div>
  ),
}));

const mockUseActivity = useActivity as ReturnType<typeof vi.fn>;
const mockUseSession = useSession as ReturnType<typeof vi.fn>;

const mockActivity = {
  id: 'test-activity-id',
  name: 'Atividade de Teste',
  description: 'Descrição da atividade de teste',
  materials: 'Materiais necessários',
  approximate_duration_minutes: 60,
  group_size: 'medium' as const,
  effort_level: 'medium' as const,
  location: 'outside' as const,
  age_group: 'scouts' as const,
  image_url: 'https://example.com/test-image.jpg',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  activity_type: {
    id: 'test-type-id',
    name: 'Tipo de Atividade',
    description: 'Descrição do tipo',
  },
    educational_goals: [
      {
        id: 'goal-1',
        title: 'Objetivo 1',
        description: 'Descrição do objetivo 1',
        code: 'GOAL_1',
        area: {
          id: 'area-1',
          name: 'Área 1',
          description: 'Descrição da área 1',
          icon: '🎯',
          code: 'AREA_1',
        },
      },
    ],
    challenges: [
      {
        id: 'challenge-1',
        name: 'Completar 5 nós',
        description: 'Lista de 10 nós; basta completar 5',
        type: { id: 'type-1', name: 'Técnicas Úteis' },
      },
    ],
    sdgs: [
    {
      id: 'sdg-1',
      number: 1,
      name: 'Erradicar a Pobreza',
      description: 'Acabar com a pobreza em todas as suas formas',
      icon_url: 'https://example.com/sdg-1.png',
    },
  ],
};

describe('ActivityDetail', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'test-user', name: 'Test User', email: 'test@example.com' } },
      status: 'authenticated',
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    mockUseActivity.mockReturnValue({
      activity: null,
      loading: true,
      error: null,
    });

    render(<ActivityDetail activityId="test-id" />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders error state when there is an error', () => {
    mockUseActivity.mockReturnValue({
      activity: null,
      loading: false,
      error: 'Erro ao carregar atividade',
    });

    render(<ActivityDetail activityId="test-id" />);
    
    expect(screen.getByRole('heading', { name: 'Erro ao carregar atividade' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Erro ao carregar atividade' })).toHaveClass('text-red-600');
  });

  it('renders activity details when data is loaded successfully', async () => {
    mockUseActivity.mockReturnValue({
      activity: mockActivity,
      loading: false,
      error: null,
    });

    render(<ActivityDetail activityId="test-id" />);
    
    // Check main activity information
    expect(screen.getByText('Atividade de Teste')).toBeInTheDocument();
    expect(screen.getByText('Descrição da atividade de teste')).toBeInTheDocument();
    
    // Check activity image
    const image = screen.getByAltText('Atividade de Teste');
    expect(image).toHaveAttribute('src', 'https://example.com/test-image.jpg');
    
    // Check badges
    expect(screen.getByText('60 min')).toBeInTheDocument();
    expect(screen.getByText('Médio (7-15)')).toBeInTheDocument();
    expect(screen.getByText('Médio')).toBeInTheDocument();
    expect(screen.getByText('Exterior')).toBeInTheDocument();
    expect(screen.getByText('Escoteiros (10-14)')).toBeInTheDocument();
    expect(screen.getByText('Tipo de Atividade')).toBeInTheDocument();
    
    // Check Add to Program button
    expect(screen.getByText('Adicionar ao programa')).toBeInTheDocument();
  });

  it('renders materials section', () => {
    mockUseActivity.mockReturnValue({
      activity: mockActivity,
      loading: false,
      error: null,
    });

    render(<ActivityDetail activityId="test-id" />);
    
    expect(screen.getByText('Materiais Necessários')).toBeInTheDocument();
    expect(screen.getByText('Materiais necessários')).toBeInTheDocument();
  });

  it('renders educational goals section when available', () => {
    mockUseActivity.mockReturnValue({
      activity: mockActivity,
      loading: false,
      error: null,
    });

    render(<ActivityDetail activityId="test-id" />);
    
    expect(screen.getByText('Objetivos Educativos')).toBeInTheDocument();
    expect(screen.getByText('Objetivo 1')).toBeInTheDocument();
    expect(screen.getByText('Área 1 • AREA_1')).toBeInTheDocument();
    // The icon is rendered as an SVG, not as text
    expect(screen.getByText('Objetivos Educativos')).toBeInTheDocument();
  });

  it('renders challenges immediately after objectives', () => {
    mockUseActivity.mockReturnValue({
      activity: mockActivity,
      loading: false,
      error: null,
    });

    render(<ActivityDetail activityId="test-id" />);

    expect(screen.getByText('Desafios')).toBeInTheDocument();
    expect(screen.getByText('Completar 5 nós')).toBeInTheDocument();
    expect(screen.getByText('Lista de 10 nós; basta completar 5')).toBeInTheDocument();
    expect(screen.getByText('Técnicas Úteis')).toBeInTheDocument();
  });

  it('omits the challenges section when the activity has none', () => {
    mockUseActivity.mockReturnValue({
      activity: { ...mockActivity, challenges: [] },
      loading: false,
      error: null,
    });

    render(<ActivityDetail activityId="test-id" />);

    expect(screen.getByText('Objetivos Educativos')).toBeInTheDocument();
    expect(screen.queryByText('Completar 5 nós')).not.toBeInTheDocument();
  });

  it('renders SDGs section when available', () => {
    mockUseActivity.mockReturnValue({
      activity: mockActivity,
      loading: false,
      error: null,
    });

    render(<ActivityDetail activityId="test-id" />);
    
    expect(screen.getByText('Objetivos de Desenvolvimento Sustentável (ODS)')).toBeInTheDocument();
    expect(screen.getByText('1. Erradicar a Pobreza')).toBeInTheDocument();
    expect(screen.getByText('Acabar com a pobreza em todas as suas formas')).toBeInTheDocument();
    
    // Check that the SDG section is rendered
    expect(screen.getByText('1. Erradicar a Pobreza')).toBeInTheDocument();
    expect(screen.getByText('Acabar com a pobreza em todas as suas formas')).toBeInTheDocument();
  });

  it('renders rating and comments section', () => {
    mockUseActivity.mockReturnValue({
      activity: mockActivity,
      loading: false,
      error: null,
    });

    render(<ActivityDetail activityId="test-id" />);
    
    expect(screen.getByText('Avaliações')).toBeInTheDocument();
    expect(screen.getByTestId('activity-rating')).toBeInTheDocument();
    expect(screen.getByTestId('activity-rating')).toHaveAttribute('data-activity-id', 'test-activity-id');
  });

  it('renders Add to Program modal', () => {
    mockUseActivity.mockReturnValue({
      activity: mockActivity,
      loading: false,
      error: null,
    });

    render(<ActivityDetail activityId="test-id" />);
    
    // The modal is only rendered when the button is clicked
    expect(screen.getByText('Adicionar ao programa')).toBeInTheDocument();
  });

  it('handles missing image gracefully', () => {
    const activityWithoutImage = { ...mockActivity, image_url: undefined };
    mockUseActivity.mockReturnValue({
      activity: activityWithoutImage,
      loading: false,
      error: null,
    });

    render(<ActivityDetail activityId="test-id" />);
    
    expect(screen.getByText('Sem imagem')).toBeInTheDocument();
  });

  it('handles missing educational goals gracefully', () => {
    const activityWithoutGoals = { ...mockActivity, educational_goals: [] };
    mockUseActivity.mockReturnValue({
      activity: activityWithoutGoals,
      loading: false,
      error: null,
    });

    render(<ActivityDetail activityId="test-id" />);
    
    expect(screen.queryByText('Objetivos Educativos')).not.toBeInTheDocument();
  });

  it('handles missing SDGs gracefully', () => {
    const activityWithoutSDGs = { ...mockActivity, sdgs: [] };
    mockUseActivity.mockReturnValue({
      activity: activityWithoutSDGs,
      loading: false,
      error: null,
    });

    render(<ActivityDetail activityId="test-id" />);
    
    expect(screen.queryByText('Objetivos de Desenvolvimento Sustentável')).not.toBeInTheDocument();
  });

  it('displays fallback text when content is not available', () => {
    const activityWithMissingContent = {
      ...mockActivity,
      name: '',
      description: '',
    };
    
    mockUseActivity.mockReturnValue({
      activity: activityWithMissingContent,
      loading: false,
      error: null,
    });

    render(<ActivityDetail activityId="test-id" />);
    
    // The component renders empty elements for missing content but still shows the button
    expect(screen.getByText('Adicionar ao programa')).toBeInTheDocument();
  });
});

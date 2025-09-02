import { render, screen, waitFor } from '@testing-library/react';
import { ActivityDetail } from '@/components/features/activities/ActivityDetail';
import { useActivity } from '@/hooks/useActivity';
import { useSession } from 'next-auth/react';

// Mock the hooks
jest.mock('@/hooks/useActivity');
jest.mock('next-auth/react');
jest.mock('@/components/features/activities/ActivityRating', () => ({
  ActivityRating: ({ activityId }: { activityId: string }) => (
    <div data-testid="activity-rating" data-activity-id={activityId}>
      Activity Rating Component
    </div>
  ),
}));
jest.mock('@/components/features/activities/AddToProgramModal', () => ({
  AddToProgramModal: ({ isOpen, onClose, activity }: any) => (
    <div data-testid="add-to-program-modal" data-is-open={isOpen} data-activity-id={activity.id}>
      Add to Program Modal
    </div>
  ),
}));

const mockUseActivity = useActivity as jest.MockedFunction<typeof useActivity>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

const mockActivity = {
  id: 'test-activity-id',
  name: { pt: 'Atividade de Teste', en: 'Test Activity' },
  description: { pt: 'Descrição da atividade de teste', en: 'Test activity description' },
  materials: { pt: 'Materiais necessários', en: 'Required materials' },
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
    name: { pt: 'Tipo de Atividade', en: 'Activity Type' },
    description: { pt: 'Descrição do tipo', en: 'Type description' },
  },
  educational_goals: [
    {
      id: 'goal-1',
      title: { pt: 'Objetivo 1', en: 'Goal 1' },
      description: { pt: 'Descrição do objetivo 1', en: 'Goal 1 description' },
      code: 'GOAL_1',
      area: {
        id: 'area-1',
        name: { pt: 'Área 1', en: 'Area 1' },
        description: { pt: 'Descrição da área 1', en: 'Area 1 description' },
        icon: '🎯',
        code: 'AREA_1',
      },
    },
  ],
  sdgs: [
    {
      id: 'sdg-1',
      number: 1,
      name: { pt: 'Erradicar a Pobreza', en: 'No Poverty' },
      description: { pt: 'Acabar com a pobreza em todas as suas formas', en: 'End poverty in all its forms' },
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
    jest.clearAllMocks();
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
    
    expect(screen.getByText('Erro ao carregar atividade')).toBeInTheDocument();
    expect(screen.getByText('Erro ao carregar atividade')).toHaveClass('text-red-600');
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
    expect(screen.getByText('Médio (6-15)')).toBeInTheDocument();
    expect(screen.getByText('Médio')).toBeInTheDocument();
    expect(screen.getByText('Exterior')).toBeInTheDocument();
    expect(screen.getByText('Escoteiros (10-14)')).toBeInTheDocument();
    expect(screen.getByText('Tipo de Atividade')).toBeInTheDocument();
    
    // Check Add to Program button
    expect(screen.getByText('Adicionar ao Programa')).toBeInTheDocument();
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
    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  it('renders SDGs section when available', () => {
    mockUseActivity.mockReturnValue({
      activity: mockActivity,
      loading: false,
      error: null,
    });

    render(<ActivityDetail activityId="test-id" />);
    
    expect(screen.getByText('Objetivos de Desenvolvimento Sustentável')).toBeInTheDocument();
    expect(screen.getByText('1. Erradicar a Pobreza')).toBeInTheDocument();
    expect(screen.getByText('Acabar com a pobreza em todas as suas formas')).toBeInTheDocument();
    
    const sdgImage = screen.getByAltText('SDG 1');
    expect(sdgImage).toHaveAttribute('src', 'https://example.com/sdg-1.png');
  });

  it('renders rating and comments section', () => {
    mockUseActivity.mockReturnValue({
      activity: mockActivity,
      loading: false,
      error: null,
    });

    render(<ActivityDetail activityId="test-id" />);
    
    expect(screen.getByText('Avaliações e Comentários')).toBeInTheDocument();
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
    
    expect(screen.getByTestId('add-to-program-modal')).toBeInTheDocument();
    expect(screen.getByTestId('add-to-program-modal')).toHaveAttribute('data-activity-id', 'test-activity-id');
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

  it('displays fallback text when Portuguese content is not available', () => {
    const activityWithEnglishOnly = {
      ...mockActivity,
      name: { en: 'Test Activity' },
      description: { en: 'Test activity description' },
    };
    
    mockUseActivity.mockReturnValue({
      activity: activityWithEnglishOnly,
      loading: false,
      error: null,
    });

    render(<ActivityDetail activityId="test-id" />);
    
    expect(screen.getByText('Test Activity')).toBeInTheDocument();
    expect(screen.getByText('Test activity description')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
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
  AddToProgramModal: ({ isOpen, activity }: any) => (
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
  group_sizes: ['medium' as const],
  effort_level: 'medium' as const,
  locations: ['outside' as const],
  age_groups: ['scouts' as const],
  image_url: 'https://example.com/test-image.jpg',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
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
  sdgs: [
    {
      id: 'sdg-1',
      number: 1,
      name: 'Erradicar a Pobreza',
      description: 'Acabar com a pobreza em todas as suas formas',
      icon_url: 'https://example.com/sdg-1.png',
      justification: 'Porque o jogo partilha recursos.',
    },
  ],
  objectives: [
    { goal_id: 'goal-1', code: 'GOAL_1', title: 'Objetivo 1', age_group: 'scouts', behaviour: 'Partilha o material sem insistir.' },
  ],
  challenges: [
    { id: 'c1', code: 'EVAS-B', title: 'Participa em 3 jogos.', age_group: 'scouts', type_code: 'EVAS', type_name: 'Estilo de Vida Ativo e Saudável' },
  ],
  physical_risk_level: 'medium' as const,
  physical_risk: 'Quedas durante a corrida.',
  physical_mitigation: 'Campo livre de buracos.',
  source: { id: 's1', code: 'OSM', name: 'Online Scout Manager', url: 'https://example.com/osm', license: '© Online Youth Manager Ltd' },
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
    expect(screen.getByRole('heading', { name: 'Erro ao carregar atividade' })).toHaveClass('text-destructive');
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
    // "Médio" is both the effort and the physical risk level in this fixture.
    expect(screen.getAllByText('Médio').length).toBeGreaterThan(0);
    expect(screen.getByText('Exterior')).toBeInTheDocument();
    expect(screen.getAllByText('Escoteiros (10-14)').length).toBeGreaterThan(0);
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
    
    expect(screen.getByText('Materiais')).toBeInTheDocument();
    expect(screen.getByText('Materiais necessários')).toBeInTheDocument();
  });

  it('renders objectives per division with how to observe them', () => {
    mockUseActivity.mockReturnValue({ activity: mockActivity, loading: false, error: null });

    render(<ActivityDetail activityId="test-id" />);

    expect(screen.getByText('Objetivos e como observar')).toBeInTheDocument();
    expect(screen.getByText('Objetivo 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Tribo de Escoteiros: GOAL_1')).toBeInTheDocument();
    expect(screen.getByText('Partilha o material sem insistir.')).toBeInTheDocument();
  });

  it('renders SDGs with their image and justification', () => {
    mockUseActivity.mockReturnValue({ activity: mockActivity, loading: false, error: null });

    render(<ActivityDetail activityId="test-id" />);

    expect(screen.getByText('ODS e porquê')).toBeInTheDocument();
    expect(screen.getByText('Erradicar a Pobreza')).toBeInTheDocument();
    expect(screen.getByAltText('ODS 1: Erradicar a Pobreza')).toBeInTheDocument();
    expect(screen.getByText('Porque o jogo partilha recursos.')).toBeInTheDocument();
  });

  it('renders the safety section with the risk and its mitigation', () => {
    mockUseActivity.mockReturnValue({ activity: mockActivity, loading: false, error: null });

    render(<ActivityDetail activityId="test-id" />);

    expect(screen.getByText('Segurança')).toBeInTheDocument();
    expect(screen.getByText('Quedas durante a corrida.')).toBeInTheDocument();
    expect(screen.getByText('Campo livre de buracos.')).toBeInTheDocument();
  });

  it('says the risk analysis is not available instead of hiding the safety section', () => {
    mockUseActivity.mockReturnValue({
      activity: { ...mockActivity, physical_risk_level: null, physical_risk: null, physical_mitigation: null },
      loading: false,
      error: null,
    });

    render(<ActivityDetail activityId="test-id" />);

    expect(screen.getByText('Análise de risco ainda não disponível')).toBeInTheDocument();
  });

  it('shows the source once, in the header, with its licence', () => {
    mockUseActivity.mockReturnValue({ activity: mockActivity, loading: false, error: null });

    render(<ActivityDetail activityId="test-id" />);

    expect(screen.getAllByText(/Online Scout Manager/)).toHaveLength(1);
    expect(screen.getByText(/© Online Youth Manager Ltd/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Online Scout Manager/ })).toHaveAttribute('href', 'https://example.com/osm');
  });

  it('lists the linked desafios with their own division', () => {
    mockUseActivity.mockReturnValue({ activity: mockActivity, loading: false, error: null });

    render(<ActivityDetail activityId="test-id" />);

    expect(screen.getByText('EVAS-B')).toBeInTheDocument();
    expect(screen.getByText('Participa em 3 jogos.')).toBeInTheDocument();
  });

  it('shows the format and focuses above the title, and the duration range', () => {
    mockUseActivity.mockReturnValue({
      activity: {
        ...mockActivity,
        format: { id: 'f1', code: 'jogo', name: 'Jogo' },
        focus: { id: 'o1', code: 'cooperacao', name: 'Cooperação' },
        secondary_focus: { id: 'o2', code: 'lideranca', name: 'Liderança' },
        duration_min_minutes: 40,
        duration_max_minutes: 75,
      },
      loading: false,
      error: null,
    });

    render(<ActivityDetail activityId="test-id" />);

    expect(screen.getByText('Jogo · Cooperação · Liderança')).toBeInTheDocument();
    expect(screen.getByText('40–75 min')).toBeInTheDocument();
    expect(screen.queryByText('60 min')).not.toBeInTheDocument();
  });

  it('shows no kind label for an activity with neither format nor focus', () => {
    mockUseActivity.mockReturnValue({ activity: mockActivity, loading: false, error: null });
    render(<ActivityDetail activityId="test-id" />);
    expect(screen.queryByText(/Jogo|Cooperação|Liderança/)).not.toBeInTheDocument();
    expect(screen.getByText('60 min')).toBeInTheDocument();
  });

  it('shows the short title of a desafio first and the full text on demand, with the integration highlight', () => {
    mockUseActivity.mockReturnValue({
      activity: {
        ...mockActivity,
        challenges: [
          {
            id: 'c2',
            code: 'VAL-D',
            title: 'Acumula 3 noites de campo (tenda ou abrigo) em atividade, deixando o campo limpo.',
            short_title: 'Acumula 3 noites de campo.',
            integration_age_groups: ['scouts', 'adventurers'],
            age_group: 'cub_scouts',
            type_code: 'VAL',
            type_name: 'Vida ao Ar Livre',
          },
        ],
      },
      loading: false,
      error: null,
    });

    render(<ActivityDetail activityId="test-id" />);

    expect(screen.getByText('Acumula 3 noites de campo.')).toBeInTheDocument();
    expect(screen.getByTestId('integration-badge')).toHaveTextContent('Obrigatório para a integração: Escoteiros (10-14), Exploradores (14-17)');
    expect(screen.getByText('Texto completo')).toBeInTheDocument();
    expect(screen.getByText(/tenda ou abrigo/)).toBeInTheDocument();
  });

  it('shows no integration highlight and no full-text toggle when there is nothing to add', () => {
    mockUseActivity.mockReturnValue({ activity: mockActivity, loading: false, error: null });
    render(<ActivityDetail activityId="test-id" />);
    expect(screen.queryByTestId('integration-badge')).not.toBeInTheDocument();
    expect(screen.queryByText('Texto completo')).not.toBeInTheDocument();
  });

  it('renders rating and comments section', () => {
    mockUseActivity.mockReturnValue({
      activity: mockActivity,
      loading: false,
      error: null,
    });

    render(<ActivityDetail activityId="test-id" />);
    
    expect(screen.getByRole('region', { name: 'Avaliações' })).toBeInTheDocument();
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

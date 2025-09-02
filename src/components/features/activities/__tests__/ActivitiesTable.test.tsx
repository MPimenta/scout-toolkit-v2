import { render, screen, fireEvent } from '@testing-library/react';
import { ActivitiesTable } from '../ActivitiesTable';

// Mock the table components since they might not be available in test environment
jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <div data-testid="table">{children}</div>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="table-header">{children}</div>,
  TableBody: ({ children }: { children: React.ReactNode }) => <div data-testid="table-body">{children}</div>,
  TableRow: ({ children }: { children: React.ReactNode }) => <div data-testid="table-row">{children}</div>,
  TableHead: ({ children }: { children: React.ReactNode }) => <div data-testid="table-head">{children}</div>,
  TableCell: ({ children }: { children: React.ReactNode }) => <div data-testid="table-cell">{children}</div>,
}));

const mockActivities = [
  {
    id: '1',
    name: { pt: 'Atividade de Teste', en: 'Test Activity' },
    description: { pt: 'Descrição de teste', en: 'Test description' },
    approximate_duration_minutes: 60,
    group_size: 'medium' as const,
    effort_level: 'medium' as const,
    location: 'outside' as const,
    age_group: 'scouts' as const,
    created_at: '2024-01-01T00:00:00Z',
    activity_type: {
      id: '1',
      name: { pt: 'Jogo', en: 'Game' },
    },
    educational_goals: [
      {
        id: '1',
        title: { pt: 'Trabalho em Equipa', en: 'Teamwork' },
        code: 'SE1',
      },
    ],
    sdgs: [
      {
        id: '1',
        number: 4,
        name: { pt: 'Educação de Qualidade', en: 'Quality Education' },
        icon_url: '/sdg-icons/sdg-4.png',
      },
    ],
  },
];

describe('ActivitiesTable', () => {
  const mockOnViewActivity = jest.fn();
  const mockOnEditActivity = jest.fn();
  const mockOnDeleteActivity = jest.fn();

  beforeEach(() => {
    mockOnViewActivity.mockClear();
    mockOnEditActivity.mockClear();
    mockOnDeleteActivity.mockClear();
  });

  it('renders table with activities', () => {
    render(
      <ActivitiesTable 
        activities={mockActivities}
        onViewActivity={mockOnViewActivity}
        onEditActivity={mockOnEditActivity}
        onDeleteActivity={mockOnDeleteActivity}
      />
    );

    expect(screen.getByText('Vista em Tabela')).toBeInTheDocument();
    expect(screen.getByText('Atividade de Teste')).toBeInTheDocument();
    expect(screen.getByText('Jogo')).toBeInTheDocument();
    expect(screen.getByText('60 min')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(
      <ActivitiesTable 
        activities={mockActivities}
        onViewActivity={mockOnViewActivity}
        onEditActivity={mockOnEditActivity}
        onDeleteActivity={mockOnDeleteActivity}
      />
    );

    expect(screen.getByPlaceholderText('Pesquisar atividades...')).toBeInTheDocument();
  });

  it('renders export CSV button', () => {
    render(
      <ActivitiesTable 
        activities={mockActivities}
        onViewActivity={mockOnViewActivity}
        onEditActivity={mockOnEditActivity}
        onDeleteActivity={mockOnDeleteActivity}
      />
    );

    expect(screen.getByText('Exportar CSV')).toBeInTheDocument();
  });

  it('displays correct group size text', () => {
    render(
      <ActivitiesTable 
        activities={mockActivities}
        onViewActivity={mockOnViewActivity}
        onEditActivity={mockOnEditActivity}
        onDeleteActivity={mockOnDeleteActivity}
      />
    );

    expect(screen.getByText('Médio (7-15)')).toBeInTheDocument();
  });

  it('displays correct effort level text', () => {
    render(
      <ActivitiesTable 
        activities={mockActivities}
        onViewActivity={mockOnViewActivity}
        onEditActivity={mockOnEditActivity}
        onDeleteActivity={mockOnDeleteActivity}
      />
    );

    expect(screen.getByText('Médio')).toBeInTheDocument();
  });

  it('displays correct location text', () => {
    render(
      <ActivitiesTable 
        activities={mockActivities}
        onViewActivity={mockOnViewActivity}
        onEditActivity={mockOnEditActivity}
        onDeleteActivity={mockOnDeleteActivity}
      />
    );

    expect(screen.getByText('Exterior')).toBeInTheDocument();
  });

  it('displays correct age group text', () => {
    render(
      <ActivitiesTable 
        activities={mockActivities}
        onViewActivity={mockOnViewActivity}
        onEditActivity={mockOnEditActivity}
        onDeleteActivity={mockOnDeleteActivity}
      />
    );

    expect(screen.getByText('Escoteiros (10-14)')).toBeInTheDocument();
  });

  it('displays SDG information', () => {
    render(
      <ActivitiesTable 
        activities={mockActivities}
        onViewActivity={mockOnViewActivity}
        onEditActivity={mockOnEditActivity}
        onDeleteActivity={mockOnDeleteActivity}
      />
    );

    // Check that SDG number is displayed
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('displays educational goals', () => {
    render(
      <ActivitiesTable 
        activities={mockActivities}
        onViewActivity={mockOnViewActivity}
        onEditActivity={mockOnEditActivity}
        onDeleteActivity={mockOnDeleteActivity}
      />
    );

    expect(screen.getByText('Trabalho em Equipa')).toBeInTheDocument();
  });

  it('shows pagination information', () => {
    render(
      <ActivitiesTable 
        activities={mockActivities}
        onViewActivity={mockOnViewActivity}
        onEditActivity={mockOnEditActivity}
        onDeleteActivity={mockOnDeleteActivity}
      />
    );

    expect(screen.getByText('Mostrando 1 de 1 atividades.')).toBeInTheDocument();
  });

  it('handles empty activities array', () => {
    render(
      <ActivitiesTable 
        activities={[]}
        onViewActivity={mockOnViewActivity}
        onEditActivity={mockOnEditActivity}
        onDeleteActivity={mockOnDeleteActivity}
      />
    );

    expect(screen.getByText('Nenhuma atividade encontrada.')).toBeInTheDocument();
  });

  it('calls onViewActivity when view action is clicked', () => {
    render(
      <ActivitiesTable 
        activities={mockActivities}
        onViewActivity={mockOnViewActivity}
        onEditActivity={mockOnEditActivity}
        onDeleteActivity={mockOnDeleteActivity}
      />
    );

    // Find and click the actions menu
    const actionsButton = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(actionsButton);

    // Click view details
    const viewButton = screen.getByText('Ver Detalhes');
    fireEvent.click(viewButton);

    expect(mockOnViewActivity).toHaveBeenCalledWith(mockActivities[0]);
  });

  it('calls onEditActivity when edit action is clicked', () => {
    render(
      <ActivitiesTable 
        activities={mockActivities}
        onViewActivity={mockOnViewActivity}
        onEditActivity={mockOnEditActivity}
        onDeleteActivity={mockOnDeleteActivity}
      />
    );

    // Find and click the actions menu
    const actionsButton = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(actionsButton);

    // Click edit
    const editButton = screen.getByText('Editar');
    fireEvent.click(editButton);

    expect(mockOnEditActivity).toHaveBeenCalledWith(mockActivities[0]);
  });

  it('calls onDeleteActivity when delete action is clicked', () => {
    render(
      <ActivitiesTable 
        activities={mockActivities}
        onViewActivity={mockOnViewActivity}
        onEditActivity={mockOnEditActivity}
        onDeleteActivity={mockOnDeleteActivity}
      />
    );

    // Find and click the actions menu
    const actionsButton = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(actionsButton);

    // Click delete
    const deleteButton = screen.getByText('Eliminar');
    fireEvent.click(deleteButton);

    expect(mockOnDeleteActivity).toHaveBeenCalledWith(mockActivities[0]);
  });
});

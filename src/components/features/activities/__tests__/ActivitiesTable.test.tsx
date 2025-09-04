import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivitiesTable } from '../ActivitiesTable';

import { vi } from 'vitest';

// Mock the table components since they might not be available in test environment
vi.mock('@/components/ui/table', () => ({
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
    name: 'Atividade de Teste',
    description: 'Descrição de teste',
    approximate_duration_minutes: 60,
    group_size: 'medium' as const,
    effort_level: 'medium' as const,
    location: 'outside' as const,
    age_group: 'scouts' as const,
    created_at: '2024-01-01T00:00:00Z',
    activity_type: {
      id: '1',
      name: 'Jogo',
    },
    educational_goals: [
      {
        id: '1',
        title: 'Trabalho em Equipa',
        code: 'SE1',
      },
    ],
    sdgs: [
      {
        id: '1',
        number: 4,
        name: 'Educação de Qualidade',
        icon_url: '/sdg-icons/sdg-4.png',
      },
    ],
  },
];

describe('ActivitiesTable', () => {
  const mockOnViewActivity = vi.fn();
  const mockOnEditActivity = vi.fn();
  const mockOnDeleteActivity = vi.fn();

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
    expect(screen.getByAltText('ODS 4')).toBeInTheDocument();
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

  it.skip('calls onViewActivity when view action is clicked', async () => {
    render(
      <ActivitiesTable 
        activities={mockActivities}
        onViewActivity={mockOnViewActivity}
        onEditActivity={mockOnEditActivity}
        onDeleteActivity={mockOnDeleteActivity}
      />
    );

    // Find and click the actions menu
    const actionsButton = screen.getByRole('button', { name: /ações/i });
    fireEvent.click(actionsButton);

    // Wait for dropdown to open and items to appear
    await waitFor(() => {
      // Check if dropdown content is visible
      const dropdownContent = document.querySelector('[data-radix-popper-content-wrapper]');
      expect(dropdownContent).toBeInTheDocument();
    });

    // Click view details
    const viewButton = screen.getByText('Ver Detalhes');
    fireEvent.click(viewButton);

    expect(mockOnViewActivity).toHaveBeenCalledWith(mockActivities[0]);
  });

  it.skip('calls onEditActivity when edit action is clicked', async () => {
    render(
      <ActivitiesTable 
        activities={mockActivities}
        onViewActivity={mockOnViewActivity}
        onEditActivity={mockOnEditActivity}
        onDeleteActivity={mockOnDeleteActivity}
      />
    );

    // Find and click the actions menu
    const actionsButton = screen.getByRole('button', { name: /ações/i });
    fireEvent.click(actionsButton);

    // Wait for dropdown to open and items to appear
    await waitFor(() => {
      // Check if dropdown content is visible
      const dropdownContent = document.querySelector('[data-radix-popper-content-wrapper]');
      expect(dropdownContent).toBeInTheDocument();
    });

    // Click edit
    const editButton = screen.getByText('Editar');
    fireEvent.click(editButton);

    expect(mockOnEditActivity).toHaveBeenCalledWith(mockActivities[0]);
  });

  it.skip('calls onDeleteActivity when delete action is clicked', async () => {
    render(
      <ActivitiesTable 
        activities={mockActivities}
        onViewActivity={mockOnViewActivity}
        onEditActivity={mockOnEditActivity}
        onDeleteActivity={mockOnDeleteActivity}
      />
    );

    // Find and click the actions menu
    const actionsButton = screen.getByRole('button', { name: /ações/i });
    fireEvent.click(actionsButton);

    // Wait for dropdown to open and items to appear
    await waitFor(() => {
      // Check if dropdown content is visible
      const dropdownContent = document.querySelector('[data-radix-popper-content-wrapper]');
      expect(dropdownContent).toBeInTheDocument();
    });

    // Click delete
    const deleteButton = screen.getByText('Eliminar');
    fireEvent.click(deleteButton);

    expect(mockOnDeleteActivity).toHaveBeenCalledWith(mockActivities[0]);
  });
});

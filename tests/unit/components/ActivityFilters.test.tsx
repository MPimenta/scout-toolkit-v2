import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivityFilters, FilterState } from '@/components/features/activities/ActivityFilters';

// Mock fetch globally
global.fetch = vi.fn();

// Mock data for filter options
const mockActivityTypes = [
  { id: '1', name: { pt: 'Jogo', en: 'Game' } },
  { id: '2', name: { pt: 'Atividade Manual', en: 'Manual Activity' } },
];

const mockSdgs = [
  { id: '1', number: 1, name: { pt: 'Erradicar a Pobreza', en: 'No Poverty' } },
  { id: '2', number: 2, name: { pt: 'Fome Zero', en: 'Zero Hunger' } },
];

const mockEducationalGoals = [
  { 
    id: '1', 
    title: { pt: 'SE1: Trabalho em Equipa', en: 'SE1: Teamwork' },
    area: { name: { pt: 'Social', en: 'Social' } }
  },
  { 
    id: '2', 
    title: { pt: 'SE2: Liderança', en: 'SE2: Leadership' },
    area: { name: { pt: 'Social', en: 'Social' } }
  },
];

// Mock the ActivityFilters component props
const mockFilters: FilterState = {
  search: '',
  groupSize: [],
  effortLevel: [],
  location: '',
  ageGroup: [],
  activityType: [],
  sdgs: [],
  educationalGoals: [],
  durationMin: '',
  durationMax: '',
  durationOperator: '>=',
};

const mockOnFiltersChange = vi.fn();
const mockOnClearFilters = vi.fn();

describe('ActivityFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activity_types: mockActivityTypes })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sdgs: mockSdgs })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ educational_goals: mockEducationalGoals })
      });
  });

  it('renders all basic filter sections', () => {
    render(
      <ActivityFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // Check that the main filter section is rendered
    expect(screen.getByText('Filtros de Atividades')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Pesquisar atividades por nome, descrição ou materiais...')).toBeInTheDocument();

    // Expand the advanced filters to see all filter sections
    const expandButton = screen.getByRole('button', { name: /expandir/i });
    fireEvent.click(expandButton);

    // Now check that all filter sections are rendered
    expect(screen.getByText('Tamanho do Grupo')).toBeInTheDocument();
    expect(screen.getByText('Nível de Esforço')).toBeInTheDocument();
    expect(screen.getByText('Localização')).toBeInTheDocument();
    expect(screen.getByText('Faixa Etária')).toBeInTheDocument();
    expect(screen.getByText('Tipo de Atividade')).toBeInTheDocument();
  });

  it('handles search input changes', async () => {
    render(
      <ActivityFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    const searchInput = screen.getByPlaceholderText('Pesquisar atividades por nome, descrição ou materiais...');
    fireEvent.change(searchInput, { target: { value: 'jogo' } });

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        search: 'jogo',
      });
    });
  });

  it('handles group size filter changes', async () => {
    render(
      <ActivityFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // First expand the advanced filters
    const expandButton = screen.getByRole('button', { name: /expandir/i });
    fireEvent.click(expandButton);

    const smallGroupCheckbox = screen.getByLabelText('Pequeno (2-6)');
    fireEvent.click(smallGroupCheckbox);

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        groupSize: ['small'],
      });
    });
  });

  it('handles effort level filter changes', async () => {
    render(
      <ActivityFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // First expand the advanced filters
    const expandButton = screen.getByRole('button', { name: /expandir/i });
    fireEvent.click(expandButton);

    const mediumEffortCheckbox = screen.getByLabelText('Médio');
    fireEvent.click(mediumEffortCheckbox);

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        effortLevel: ['medium'],
      });
    });
  });

  it('handles location filter changes', async () => {
    render(
      <ActivityFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // First expand the advanced filters
    const expandButton = screen.getByRole('button', { name: /expandir/i });
    fireEvent.click(expandButton);

    const locationSelect = screen.getByDisplayValue('Todas');
    fireEvent.change(locationSelect, { target: { value: 'outside' } });

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        location: 'outside',
      });
    });
  });

  it('handles age group filter changes', async () => {
    render(
      <ActivityFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // First expand the advanced filters
    const expandButton = screen.getByRole('button', { name: /expandir/i });
    fireEvent.click(expandButton);

    const scoutsCheckbox = screen.getByLabelText('Escoteiros (10-14)');
    fireEvent.click(scoutsCheckbox);

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        ageGroup: ['scouts'],
      });
    });
  });

  it('handles activity type filter changes', async () => {
    render(
      <ActivityFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // First expand the advanced filters
    const expandButton = screen.getByRole('button', { name: /expandir/i });
    fireEvent.click(expandButton);

    // Wait for the activity types to load
    await waitFor(() => {
      expect(screen.getByText('Jogo')).toBeInTheDocument();
    });

    // Find and click an activity type checkbox
    const gameCheckbox = screen.getByLabelText(/Jogo/);
    fireEvent.click(gameCheckbox);

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        activityType: ['1'],
      });
    });
  });

  it('expands advanced filters when expand button is clicked', () => {
    render(
      <ActivityFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    const expandButton = screen.getByRole('button', { name: /expandir/i });
    fireEvent.click(expandButton);

    // Check that advanced filters are now visible
    expect(screen.getByText('Objetivos de Desenvolvimento Sustentável (ODS)')).toBeInTheDocument();
    expect(screen.getByText('Objetivos Educativos')).toBeInTheDocument();
    expect(screen.getByText('Duração (minutos)')).toBeInTheDocument();
  });

  it('handles SDG filter changes', async () => {
    render(
      <ActivityFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // First expand the advanced filters
    const expandButton = screen.getByRole('button', { name: /expandir/i });
    fireEvent.click(expandButton);

    // Wait for the SDGs to load - look for the SDG section title first
    await waitFor(() => {
      expect(screen.getByText('Objetivos de Desenvolvimento Sustentável (ODS)')).toBeInTheDocument();
    });

    // Find the SDG section specifically
    const sdgSection = screen.getByText('Objetivos de Desenvolvimento Sustentável (ODS)').closest('div')?.parentElement;
    
    // Within the SDG section, find the label that contains the text we're looking for
    const sdgLabels = sdgSection?.querySelectorAll('label');
    const sdg1Label = Array.from(sdgLabels || []).find(label => {
      const text = label.textContent || '';
      return text.includes('ODS 1') && text.includes('Erradicar a Pobreza');
    });

    if (sdg1Label) {
      const sdg1Checkbox = sdg1Label.querySelector('input[type="checkbox"]');
      if (sdg1Checkbox) {
        fireEvent.click(sdg1Checkbox);
      }
    }

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        sdgs: ['1'],
      });
    });
  });

  it('handles educational goals filter changes', async () => {
    render(
      <ActivityFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // First expand the advanced filters
    const expandButton = screen.getByRole('button', { name: /expandir/i });
    fireEvent.click(expandButton);

    // Wait for the educational goals to load
    await waitFor(() => {
      expect(screen.getByText('SE1: Trabalho em Equipa')).toBeInTheDocument();
    });

    // Find and click an educational goal checkbox
    const teamworkCheckbox = screen.getByLabelText(/SE1: Trabalho em Equipa/);
    fireEvent.click(teamworkCheckbox);

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        educationalGoals: ['1'],
      });
    });
  });

  it('handles duration filter changes', async () => {
    render(
      <ActivityFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // First expand the advanced filters
    const expandButton = screen.getByRole('button', { name: /expandir/i });
    fireEvent.click(expandButton);

    // Change duration min value
    const durationMinInput = screen.getByPlaceholderText('30');
    fireEvent.change(durationMinInput, { target: { value: '45' } });

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        durationMin: '45',
      });
    });
  });

  it('shows active filters when filters are applied', async () => {
    const filtersWithValues: FilterState = {
      ...mockFilters,
      search: 'jogo',
      groupSize: ['small'],
      effortLevel: ['medium'],
      location: 'outside',
      ageGroup: ['scouts'],
      activityType: ['1'],
      sdgs: ['1'],
      educationalGoals: ['1'],
      durationMin: '30',
      durationMax: '60',
    };

    render(
      <ActivityFilters
        filters={filtersWithValues}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // Wait for the component to load the mock data
    await waitFor(() => {
      expect(screen.getByText('Filtros Ativos')).toBeInTheDocument();
    });

    // Check that active filters are displayed
    expect(screen.getByText('Pesquisa: jogo')).toBeInTheDocument();
    expect(screen.getByText('Grupo: Pequeno (2-6)')).toBeInTheDocument();
    expect(screen.getByText('Esforço: Médio')).toBeInTheDocument();
    expect(screen.getByText('Local: Exterior')).toBeInTheDocument();
    expect(screen.getByText('Idade: Escoteiros (10-14)')).toBeInTheDocument();
    expect(screen.getByText('Tipo: Jogo')).toBeInTheDocument();
    expect(screen.getByText('ODS 1: Erradicar a Pobreza')).toBeInTheDocument();
    expect(screen.getByText('SE1: Trabalho em Equipa')).toBeInTheDocument();
    expect(screen.getByText('Duração: 30 - 60 min')).toBeInTheDocument();
  });

  it('calls onClearFilters when clear all button is clicked', () => {
    const filtersWithValues: FilterState = {
      ...mockFilters,
      search: 'jogo',
      groupSize: ['small'],
    };

    render(
      <ActivityFilters
        filters={filtersWithValues}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    const clearAllButton = screen.getByText('Limpar Todos');
    fireEvent.click(clearAllButton);

    expect(mockOnClearFilters).toHaveBeenCalled();
  });

  it('removes individual filters when X button is clicked', async () => {
    const filtersWithValues: FilterState = {
      ...mockFilters,
      search: 'jogo',
      groupSize: ['small'],
    };

    render(
      <ActivityFilters
        filters={filtersWithValues}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // Click the X button on the search filter
    const searchFilterBadge = screen.getByText('Pesquisa: jogo').closest('div');
    const searchFilterX = searchFilterBadge?.querySelector('button');
    if (searchFilterX) {
      fireEvent.click(searchFilterX);
    }

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...filtersWithValues,
        search: '',
      });
    });
  });

  it('displays correct Portuguese text for all filter options', async () => {
    render(
      <ActivityFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // First expand the advanced filters
    const expandButton = screen.getByRole('button', { name: /expandir/i });
    fireEvent.click(expandButton);

    // Wait for the component to load the mock data
    await waitFor(() => {
      expect(screen.getByText('Jogo')).toBeInTheDocument();
    });

    // Check Portuguese labels are displayed
    expect(screen.getByText('Lobitos (6-10)')).toBeInTheDocument();
    expect(screen.getByText('Escoteiros (10-14)')).toBeInTheDocument();
    expect(screen.getByText('Exploradores (14-17)')).toBeInTheDocument();
    expect(screen.getByText('Caminheiros (17-21)')).toBeInTheDocument();
    expect(screen.getByText('Dirigentes (21+)')).toBeInTheDocument();
    expect(screen.getByText('Pequeno (2-6)')).toBeInTheDocument();
    expect(screen.getByText('Médio (7-15)')).toBeInTheDocument();
    expect(screen.getByText('Grande (16+)')).toBeInTheDocument();
    expect(screen.getByText('Baixo')).toBeInTheDocument();
    expect(screen.getByText('Médio')).toBeInTheDocument();
    expect(screen.getByText('Alto')).toBeInTheDocument();
    expect(screen.getByText('Interior')).toBeInTheDocument();
    expect(screen.getByText('Exterior')).toBeInTheDocument();
  });

  it('handles multiple filter selections correctly', async () => {
    render(
      <ActivityFilters
        filters={mockFilters}
        onFiltersChange={mockOnFiltersChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // First expand the advanced filters
    const expandButton = screen.getByRole('button', { name: /expandir/i });
    fireEvent.click(expandButton);

    // Wait for the component to load the mock data
    await waitFor(() => {
      expect(screen.getByText('Jogo')).toBeInTheDocument();
    });

    // Select multiple group sizes
    const smallGroupCheckbox = screen.getByLabelText('Pequeno (2-6)');
    const mediumGroupCheckbox = screen.getByLabelText('Médio (7-15)');
    
    fireEvent.click(smallGroupCheckbox);
    fireEvent.click(mediumGroupCheckbox);

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        ...mockFilters,
        groupSize: ['small', 'medium'],
      });
    });
  });
});

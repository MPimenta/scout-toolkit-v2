import { render, screen } from '@testing-library/react';
import { AddActivityModal } from '@/components/features/programs/AddActivityModal';
import { LocaleProvider } from '@/components/locale/LocaleProvider';

vi.mock('@/hooks/useActivities', () => ({
  useAllActivities: () => ({
    activities: [
      {
        id: 'activity-1',
        name: 'Caça ao Tesouro',
        description: 'Jogo de pista',
        materials: 'Mapa',
        approximate_duration_minutes: 30,
        group_size: 'medium',
        effort_level: 'low',
        location: 'outside',
        age_group: 'scouts',
        created_at: '2024-01-01T00:00:00Z',
        activity_type: { id: 'type-1', name: 'Jogo' },
        educational_goals: [
          { id: 'goal-1', title: 'Trabalho de Equipa', code: 'TE-1' },
          { id: 'goal-2', title: 'Orientação', code: 'OR-1' },
        ],
        sdgs: [],
      },
    ],
    loading: false,
    error: null,
  }),
}));

describe('AddActivityModal', () => {
  it('shows educational goal titles instead of [object Object]', () => {
    render(
      <AddActivityModal
        open
        onClose={vi.fn()}
        onAdd={vi.fn()}
        programId="program-1"
      />
    );

    expect(screen.getByText('Trabalho de Equipa, Orientação')).toBeInTheDocument();
    expect(screen.queryByText(/\[object Object\]/)).not.toBeInTheDocument();
  });

  it('uses Portuguese chrome by default, not leftover English titles', () => {
    render(
      <AddActivityModal
        open
        onClose={vi.fn()}
        onAdd={vi.fn()}
        programId="program-1"
      />
    );

    expect(screen.getByText('Adicionar atividade ao programa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar ao programa' })).toBeInTheDocument();
    expect(screen.queryByText('Add Activity to Program')).not.toBeInTheDocument();
  });

  it('switches add-activity chrome to English', () => {
    render(
      <LocaleProvider initialLocale="en">
        <AddActivityModal
          open
          onClose={vi.fn()}
          onAdd={vi.fn()}
          programId="program-1"
        />
      </LocaleProvider>
    );

    expect(screen.getByText('Add activity to program')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to program' })).toBeInTheDocument();
  });
});


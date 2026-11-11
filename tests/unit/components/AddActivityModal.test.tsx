import { act, fireEvent, render, screen } from '@testing-library/react';
import { AddActivityModal } from '@/components/features/programs/AddActivityModal';
import { LocaleProvider } from '@/components/locale/LocaleProvider';

const useInfiniteActivities = vi.fn();

vi.mock('@/hooks/queries/useActivities', () => ({
  useInfiniteActivities: (filters: unknown) => useInfiniteActivities(filters),
}));

// The format and focus selects read the reference lists through react-query.
vi.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => ({
    data:
      queryKey[1] === 'activity-formats'
        ? [{ id: 'fmt-jogo', name: 'Jogo' }]
        : [{ id: 'foc-coop', name: 'Cooperação' }],
  }),
}));

const activity = {
  id: 'activity-1',
  name: 'Caça ao Tesouro',
  description: 'Jogo de pista',
  materials: 'Mapa',
  approximate_duration_minutes: 30,
  group_sizes: ['medium'],
  effort_level: 'low',
  locations: ['outside'],
  age_groups: ['scouts'],
  created_at: '2024-01-01T00:00:00Z',
  format: { id: 'fmt-jogo', code: 'jogo', name: 'Jogo' },
  focus: { id: 'foc-coop', code: 'cooperacao', name: 'Cooperação' },
  secondary_focus: { id: 'foc-lid', code: 'lideranca', name: 'Liderança' },
  educational_goals: [
    { id: 'goal-1', title: 'Trabalho de Equipa', code: 'TE-1' },
    { id: 'goal-2', title: 'Orientação', code: 'OR-1' },
  ],
  sdgs: [],
};

beforeEach(() => {
  useInfiniteActivities.mockReset();
  useInfiniteActivities.mockReturnValue({
    data: { pages: [{ activities: [activity], pagination: { total: 1 } }] },
    isLoading: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
  });
});

const open = (props: Partial<React.ComponentProps<typeof AddActivityModal>> = {}) =>
  render(<AddActivityModal open onClose={vi.fn()} onAdd={vi.fn()} programId="program-1" {...props} />);

describe('AddActivityModal', () => {
  it('shows educational goal titles instead of [object Object]', () => {
    open();

    expect(screen.getByText('Trabalho de Equipa, Orientação')).toBeInTheDocument();
    expect(screen.queryByText(/\[object Object\]/)).not.toBeInTheDocument();
  });

  it('shows the format, the focus and the secondary focus of each activity', () => {
    open();

    expect(screen.getByText('Jogo · Cooperação · Liderança')).toBeInTheDocument();
  });

  it('offers format and focus filters and no activity-type filter', () => {
    open();

    expect(screen.getByLabelText('Formato')).toBeInTheDocument();
    expect(screen.getByLabelText('Foco')).toBeInTheDocument();
    expect(screen.queryByLabelText('Tipo de atividade')).not.toBeInTheDocument();
  });

  it('asks the server for the first page with no filters', () => {
    open();

    expect(useInfiniteActivities).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: undefined, format: undefined, focus: undefined, location: undefined, limit: 20 })
    );
  });

  it('sends the search term (title, description and instructions are matched on the server) after a pause', async () => {
    vi.useFakeTimers();
    try {
      open();
      fireEvent.change(screen.getByPlaceholderText('Pesquisar atividades...'), { target: { value: ' lenço ' } });
      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(useInfiniteActivities).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'lenço' }));
    } finally {
      vi.useRealTimers();
    }
  });

  it('adds the chosen activity', () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    open({ onAdd, onClose });

    fireEvent.click(screen.getByText('Caça ao Tesouro'));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ id: 'activity-1' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('offers more results when there is another page', () => {
    const fetchNextPage = vi.fn();
    useInfiniteActivities.mockReturnValue({
      data: { pages: [{ activities: [activity], pagination: { total: 40 } }] },
      isLoading: false,
      isFetchingNextPage: false,
      hasNextPage: true,
      fetchNextPage,
    });
    open();

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar mais (1 de 40)' }));

    expect(fetchNextPage).toHaveBeenCalled();
  });

  it('uses Portuguese chrome by default, not leftover English titles', () => {
    open();

    expect(screen.getByText('Adicionar atividade ao programa')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar ao programa' })).toBeInTheDocument();
    expect(screen.queryByText('Add Activity to Program')).not.toBeInTheDocument();
  });

  it('switches add-activity chrome to English', () => {
    render(
      <LocaleProvider initialLocale="en">
        <AddActivityModal open onClose={vi.fn()} onAdd={vi.fn()} programId="program-1" />
      </LocaleProvider>
    );

    expect(screen.getByText('Add activity to program')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to program' })).toBeInTheDocument();
  });
});

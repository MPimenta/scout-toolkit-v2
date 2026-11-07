import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivityCard } from '@/components/features/activities/ActivityCard';
import { DurationRange } from '@/components/features/activities/filters/DurationRange';
import { ObjectiveFilterTree } from '@/components/features/activities/filters/ObjectiveFilterTree';
import { Fact } from '@/components/ui/Fact';
import { EMPTY_SELECTION, type GoalOption } from '@/lib/activities/objective-tree';

const baseActivity = {
  id: 'a1',
  name: 'Jogo da bandeira',
  description: 'Descrição',
  materials: '',
  approximate_duration_minutes: 45,
  group_sizes: ['medium'],
  effort_level: 'medium',
  locations: ['outside'],
  age_groups: ['scouts'],
  created_at: '2026-01-01',
  activity_types: [],
  educational_goals: [],
  sdgs: [],
};

describe('Fact', () => {
  it('shows the icon of its kind next to the text', () => {
    const { container } = render(<Fact kind="effort">Médio</Fact>);
    expect(container.querySelector('[data-fact="effort"]')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Médio')).toBeInTheDocument();
  });
});

describe('ActivityCard divisions and facts', () => {
  it('shows one coloured pill per division in fixed order with the full wording as name', () => {
    render(<ActivityCard activity={{ ...baseActivity, age_groups: ['rovers', 'cub_scouts', 'scouts', 'adventurers', 'leaders'] }} />);
    const pills = screen.getByTestId('card-divisions').querySelectorAll('[data-slot="division-pill"]');
    expect([...pills].map((p) => p.getAttribute('data-age-group'))).toEqual([
      'cub_scouts',
      'scouts',
      'adventurers',
      'rovers',
      'leaders',
    ]);
    expect(pills[1]).toHaveTextContent('Escoteiros');
    expect(pills[1]).toHaveAttribute('aria-label', 'Escoteiros (10-14)');
    expect(screen.queryByText(/^\+\d/)).not.toBeInTheDocument();
  });

  it('shows a single pill for one division', () => {
    render(<ActivityCard activity={baseActivity} />);
    expect(screen.getByTestId('card-divisions').querySelectorAll('[data-slot="division-pill"]')).toHaveLength(1);
  });

  it('uses the shared fact icons and no trending-up icon', () => {
    const { container } = render(<ActivityCard activity={baseActivity} />);
    for (const kind of ['duration', 'groupSize', 'effort', 'location']) {
      expect(container.querySelector(`[data-fact="${kind}"]`)).not.toBeNull();
    }
    expect(container.querySelector('.lucide-trending-up')).toBeNull();
  });
});

describe('DurationRange', () => {
  it('moves the bounds with the slider and the fields', () => {
    const onChange = vi.fn();
    render(<DurationRange min="" max="" onChange={onChange} />);
    expect(screen.getByTestId('duration-readout')).toHaveTextContent('Qualquer duração');
    fireEvent.change(screen.getByLabelText('Duração mínima'), { target: { value: '2' } });
    expect(onChange).toHaveBeenLastCalledWith({ min: '15', max: '' });
    fireEvent.change(screen.getByLabelText('Máximo (minutos)'), { target: { value: '50' } });
    expect(onChange).toHaveBeenLastCalledWith({ min: '', max: '50' });
  });

  it('shows an error and does not apply a minimum above the maximum', () => {
    const onChange = vi.fn();
    render(<DurationRange min="" max="30" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Mínimo (minutos)'), { target: { value: '60' } });
    expect(screen.getByRole('alert')).toHaveTextContent('mínimo não pode ser superior');
    expect(onChange).not.toHaveBeenCalled();
  });
});

const area = { id: 'F', name: 'Físico' };
const goals: GoalOption[] = [
  { id: 'f1', code: '4F.1.2', title: 'Relacionar a alimentação com a saúde', age_groups: ['scouts'], area, general_objective: { id: 'g4F', code: '4F', title: 'Saúde' } },
  { id: 'f2', code: '4F.3.2', title: 'Atividade física', age_groups: ['rovers'], area, general_objective: { id: 'g4F', code: '4F', title: 'Saúde' } },
];

describe('ObjectiveFilterTree', () => {
  it('selecting an area reports it and lists counts', () => {
    const onChange = vi.fn();
    render(<ObjectiveFilterTree goals={goals} ageGroups={[]} selection={EMPTY_SELECTION} onChange={onChange} />);
    expect(screen.getByText(/2 objetivos/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Físico'));
    expect(onChange).toHaveBeenCalledWith({ areas: ['F'], generals: [], goals: [] });
  });

  it('lists only objectives of the selected divisions', () => {
    render(<ObjectiveFilterTree goals={goals} ageGroups={['scouts']} selection={EMPTY_SELECTION} onChange={() => {}} />);
    expect(screen.getByText(/1 objetivos/)).toBeInTheDocument();
  });

  it('shows a partial area and a removable chip for a chosen objective', () => {
    const onChange = vi.fn();
    render(<ObjectiveFilterTree goals={goals} ageGroups={[]} selection={{ areas: [], generals: [], goals: ['f1'] }} onChange={onChange} />);
    expect((screen.getByLabelText('Físico') as HTMLInputElement).indeterminate).toBe(true);
    fireEvent.click(screen.getByLabelText('Remover filtro: 4F.1.2'));
    expect(onChange).toHaveBeenCalledWith(EMPTY_SELECTION);
  });

  it('search filters the list', () => {
    render(<ObjectiveFilterTree goals={goals} ageGroups={[]} selection={EMPTY_SELECTION} onChange={() => {}} />);
    fireEvent.change(screen.getByLabelText('Pesquisar objetivo (código ou texto)'), { target: { value: 'zzz' } });
    expect(screen.getByText('Sem objetivos para esta pesquisa.')).toBeInTheDocument();
  });
});

import { FilterPanel } from '@/components/features/activities/filters/FilterPanel';
import { EMPTY_FILTERS } from '@/lib/activities/filters';

describe('FilterPanel activity types', () => {
  const render_ = (types: Array<{ id: string; name: string; kind?: 'format' | 'focus' | null; activity_count?: number }>) =>
    render(<FilterPanel filters={EMPTY_FILTERS} onChange={() => {}} types={types} sdgs={[]} goals={[]} />);

  it('is flat while types carry no kind', () => {
    render_([{ id: '1', name: 'Jogo' }]);
    expect(screen.getByLabelText('Jogo')).toBeInTheDocument();
    expect(screen.queryByText('Formato')).not.toBeInTheDocument();
  });

  it('groups by format and focus with counts and hides empty types', () => {
    render_([
      { id: '1', name: 'Jogo', kind: 'format', activity_count: 12 },
      { id: '2', name: 'Serviço', kind: 'focus', activity_count: 3 },
      { id: '3', name: 'Vazio', kind: 'focus', activity_count: 0 },
    ]);
    expect(screen.getByText('Formato')).toBeInTheDocument();
    expect(screen.getByText('Foco')).toBeInTheDocument();
    expect(screen.getByLabelText('Jogo (12)')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Vazio/)).not.toBeInTheDocument();
  });
});

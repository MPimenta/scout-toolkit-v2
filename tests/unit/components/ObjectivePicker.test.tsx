import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  ObjectivePicker,
  goalsForAgeGroups,
  reconcileSelection,
  type PickerGoal,
} from '@/components/features/activities/ObjectivePicker';

const area = { id: 'a1', name: 'Afetivo' };
const general = { id: 'g1', code: '1A', title: 'Compreender e respeitar as suas emoções' };
const goals: PickerGoal[] = [
  { id: 'x1', code: '1A.1', title: 'Descrever as suas emoções', age_groups: ['cub_scouts'], area, general_objective: general },
  { id: 'x2', code: '1A.2', title: 'Identificar as causas', age_groups: ['scouts'], area, general_objective: general },
  { id: 'x3', code: '3A.3-4', title: 'Relações de intimidade', age_groups: ['adventurers', 'rovers'], area, general_objective: { id: 'g3', code: '3A', title: 'Estabelecer relações' } },
];

function Harness({ ageGroups, initial = [] }: { ageGroups: string[]; initial?: string[] }) {
  const [selected, setSelected] = useState<string[]>(initial);
  return <ObjectivePicker goals={goals} ageGroups={ageGroups} selected={selected} onChange={setSelected} />;
}

describe('goalsForAgeGroups / reconcileSelection', () => {
  it('keeps only objectives that belong to a selected age group', () => {
    expect(goalsForAgeGroups(goals, ['scouts']).map((g) => g.code)).toEqual(['1A.2']);
    expect(goalsForAgeGroups(goals, ['rovers']).map((g) => g.code)).toEqual(['3A.3-4']);
    expect(goalsForAgeGroups(goals, [])).toEqual([]);
  });

  it('drops objectives that no longer match and reports their codes', () => {
    expect(reconcileSelection(goals, ['scouts'], ['x1', 'x2', 'x3'])).toEqual({
      kept: ['x2'],
      removedCodes: ['1A.1', '3A.3-4'],
    });
  });

  it('keeps a shared objective while either of its age groups remains', () => {
    expect(reconcileSelection(goals, ['rovers'], ['x3']).kept).toEqual(['x3']);
  });
});

describe('ObjectivePicker', () => {
  it('asks for an age group first when none is selected', () => {
    render(<Harness ageGroups={[]} />);
    expect(screen.getByText(/Escolhe primeiro uma ou mais divisões/)).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('offers only objectives of the selected age groups, grouped by general objective', () => {
    render(<Harness ageGroups={['scouts']} />);
    expect(screen.getByText('1A.2')).toBeInTheDocument();
    expect(screen.queryByText('1A.1')).not.toBeInTheDocument();
    expect(screen.queryByText('3A.3-4')).not.toBeInTheDocument();
    expect(screen.getByText(/1A Compreender e respeitar/)).toBeInTheDocument();
    expect(screen.getByText('Afetivo')).toBeInTheDocument();
  });

  it('selects an objective and shows it as a pill in the division colour', () => {
    render(<Harness ageGroups={['scouts']} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByLabelText('Tribo de Escoteiros: 1A.2')).toBeInTheDocument();
  });

  it('filters by search text on code or title', () => {
    render(<Harness ageGroups={['cub_scouts', 'scouts', 'adventurers']} />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    fireEvent.change(screen.getByLabelText('Pesquisar objetivos'), { target: { value: 'causas' } });
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    fireEvent.change(screen.getByLabelText('Pesquisar objetivos'), { target: { value: 'zzz' } });
    expect(screen.getByText('Sem objetivos para esta pesquisa.')).toBeInTheDocument();
  });
});

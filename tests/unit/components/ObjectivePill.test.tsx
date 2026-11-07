import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ObjectivePill, pillAgeGroups } from '@/components/features/activities/ObjectivePill';

describe('ObjectivePill', () => {
  it('uses the colour of the age group the objective shares with the activity', () => {
    render(
      <ObjectivePill
        objective={{ code: '1A.2', title: 'Identificar as causas', age_groups: ['scouts'] }}
        activityAgeGroups={['scouts']}
      />
    );
    const pill = screen.getByLabelText('Tribo de Escoteiros: 1A.2');
    expect(pill).toHaveClass('bg-division-scouts');
    expect(pill).toHaveTextContent('1A.2');
  });

  it('shows one pill per shared age group for a shared objective on a two-division activity', () => {
    render(
      <ObjectivePill
        objective={{ code: '3A.3-4', age_groups: ['adventurers', 'rovers'] }}
        activityAgeGroups={['adventurers', 'rovers']}
      />
    );
    expect(screen.getByLabelText('Tribo de Exploradores: 3A.3-4')).toHaveClass('bg-division-adventurers');
    const rovers = screen.getByLabelText('Clã: 3A.3-4');
    expect(rovers).toHaveClass('bg-division-rovers');
    expect(rovers).toHaveClass('text-division-rovers-foreground');
  });

  it('shows a single pill for a shared objective on a one-division activity', () => {
    render(
      <ObjectivePill objective={{ code: '3A.3-4', age_groups: ['adventurers', 'rovers'] }} activityAgeGroups={['rovers']} />
    );
    expect(screen.getAllByLabelText(/3A\.3-4/)).toHaveLength(1);
    expect(screen.getByLabelText('Clã: 3A.3-4')).toBeInTheDocument();
  });

  it('uses the objective own age groups when no activity is given (filters, pickers)', () => {
    render(<ObjectivePill objective={{ code: '4S.2.2-3', age_groups: ['scouts', 'adventurers'] }} />);
    expect(screen.getAllByLabelText(/4S\.2\.2-3/)).toHaveLength(2);
  });

  it('falls back to a neutral pill for an objective without a matching division', () => {
    render(<ObjectivePill objective={{ code: 'LEGACY_1', age_groups: [] }} activityAgeGroups={['scouts']} />);
    const pill = screen.getByLabelText('LEGACY_1');
    expect(pill).toHaveClass('border-border');
    expect(pill.className).not.toMatch(/division/);
  });

  it('orders pills by division', () => {
    expect(pillAgeGroups({ code: 'x', age_groups: ['rovers', 'scouts'] }, ['scouts', 'rovers'])).toEqual(['scouts', 'rovers']);
  });
});

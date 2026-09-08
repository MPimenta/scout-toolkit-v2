import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ActivityCard } from '@/components/features/activities/ActivityCard';

const baseActivity = {
  id: 'act-1',
  name: 'Construção de Abrigo',
  description: 'Construir um abrigo com materiais naturais.',
  materials: 'Cordas',
  approximate_duration_minutes: 90,
  group_size: 'medium',
  effort_level: 'high',
  location: 'outside',
  age_group: 'rovers',
  created_at: '2024-01-01T00:00:00Z',
  activity_type: { id: 'type-1', name: 'Técnica' },
  educational_goals: [{ id: 'goal-1', title: 'Trabalho em Equipa', code: 'SE1' }],
  sdgs: [{ id: 'sdg-1', number: 4, name: 'Educação de Qualidade', icon_url: '/sdg-4.png' }],
};

describe('ActivityCard', () => {
  it('shows up to three challenge badges next to objectives', () => {
    render(
      <ActivityCard
        activity={{
          ...baseActivity,
          challenges: [
            { id: 'c1', name: 'Completar 5 nós' },
            { id: 'c2', name: 'Caminhada de 5 km' },
            { id: 'c3', name: 'Montar um abrigo simples' },
            { id: 'c4', name: 'Cuidar do espaço comum' },
          ],
        }}
      />
    );

    expect(screen.getByText('Objetivos Educativos:')).toBeInTheDocument();
    expect(screen.getByText('Trabalho em Equipa')).toBeInTheDocument();
    expect(screen.getByText('Desafios:')).toBeInTheDocument();
    expect(screen.getByText('Completar 5 nós')).toBeInTheDocument();
    expect(screen.getByText('Caminhada de 5 km')).toBeInTheDocument();
    expect(screen.getByText('Montar um abrigo simples')).toBeInTheDocument();
    expect(screen.queryByText('Cuidar do espaço comum')).not.toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('omits the challenges block when the activity has none', () => {
    render(<ActivityCard activity={{ ...baseActivity, challenges: [] }} />);

    expect(screen.getByText('Objetivos Educativos:')).toBeInTheDocument();
    expect(screen.queryByText('Desafios:')).not.toBeInTheDocument();
  });
});

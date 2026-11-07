import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActivityEditorForm, pruneObjectives } from '@/components/features/activities/ActivityEditorForm';

const area = { id: 'a1', name: 'Social' };
const general = { id: 'g1', code: '1S', title: 'Demonstrar competências de comunicação' };
const taxonomies: Record<string, unknown> = {
  '/api/taxonomies/activity-types': { activity_types: [{ id: '11111111-1111-4111-8111-111111111111', name: 'Jogo' }] },
  '/api/taxonomies/educational-goals': {
    educational_goals: [
      { id: 'goal-scouts', code: '1S.2', title: 'Expressar as suas ideias', age_groups: ['scouts'], area, general_objective: general },
      { id: 'goal-rovers', code: '1S.4', title: 'Comunicar com empatia', age_groups: ['rovers'], area, general_objective: general },
    ],
  },
  '/api/taxonomies/sdgs': { sdgs: [{ id: 'sdg-3', number: 3, name: 'Saúde de Qualidade' }] },
  '/api/taxonomies/challenges': { challenges: [{ id: 'ch-1', code: 'EVAS-B', title: 'Participa em 3 jogos.', age_group: 'scouts', type: { code: 'EVAS', name: 'Estilo de Vida' } }] },
  '/api/taxonomies/activity-sources': { activity_sources: [{ id: 'src-1', name: 'Online Scout Manager' }] },
};

describe('pruneObjectives', () => {
  it('drops the rows of removed divisions and lists their codes once', () => {
    const rows = [
      { goal_id: 'a', age_group: 'scouts', behaviour: 'x' },
      { goal_id: 'b', age_group: 'rovers', behaviour: '' },
      { goal_id: 'b', age_group: 'leaders', behaviour: '' },
    ];
    expect(pruneObjectives(rows, ['scouts'], (id) => id.toUpperCase())).toEqual({
      kept: [rows[0]],
      removedCodes: ['B'],
    });
  });

  it('keeps everything when every division is still selected', () => {
    const rows = [{ goal_id: 'a', age_group: 'scouts', behaviour: '' }];
    expect(pruneObjectives(rows, ['scouts', 'rovers'], (id) => id)).toEqual({ kept: rows, removedCodes: [] });
  });
});

describe('ActivityEditorForm', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.method) return { ok: true, json: async () => ({}) };
      return { ok: true, json: async () => taxonomies[url] ?? {} };
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('offers the safety fields and the six steps', async () => {
    render(<ActivityEditorForm action="/api/admin/activities" submitLabel="Criar" />);
    for (const label of ['1. Essencial', '2. Instruções', '3. Segurança', '4. Objetivos', '5. ODS', '6. Desafios']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole('button', { name: '3. Segurança' }));
    expect(screen.getAllByLabelText('O que pode correr mal')).toHaveLength(2);
    expect(screen.getAllByLabelText('Como reduzir')).toHaveLength(2);
  });

  it('shows an objective picker and a behaviour field for each selected division', async () => {
    render(<ActivityEditorForm action="/api/admin/activities" submitLabel="Criar" defaults={{ age_groups: ['scouts', 'rovers'] }} />);
    fireEvent.click(screen.getByRole('button', { name: '4. Objetivos' }));
    await waitFor(() => expect(screen.getByText('1S.2')).toBeInTheDocument());
    const scouts = screen.getByTestId('objectives-scouts');
    expect(scouts).toHaveTextContent('1S.2');
    expect(scouts).not.toHaveTextContent('1S.4');
    expect(screen.getByTestId('objectives-rovers')).toHaveTextContent('1S.4');
  });

  it('sends objectives per division, SDG justifications and desafios', async () => {
    render(
      <ActivityEditorForm
        action="/api/admin/activities"
        submitLabel="Criar"
        defaults={{
          name: 'Jogo',
          description: 'd',
          materials: 'm',
          approximate_duration_minutes: 30,
          age_groups: ['scouts'],
          activity_type_ids: ['11111111-1111-4111-8111-111111111111'],
          objectives: [{ goal_id: 'goal-scouts', age_group: 'scouts', behaviour: 'Partilha a vez' }],
          sdgs: [{ sdg_id: 'sdg-3', justification: 'Mantém o corpo ativo' }],
          challenge_ids: ['ch-1'],
          physical_risk_level: 'medium',
          physical_risk: 'Quedas',
        }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    await waitFor(() => expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(true));
    const [, init] = fetchMock.mock.calls.find(([, call]) => call?.method === 'PATCH')!;
    const body = JSON.parse(init.body as string);
    expect(body.objectives).toEqual([{ goal_id: 'goal-scouts', age_group: 'scouts', behaviour: 'Partilha a vez' }]);
    expect(body.sdgs).toEqual([{ sdg_id: 'sdg-3', justification: 'Mantém o corpo ativo' }]);
    expect(body.challenge_ids).toEqual(['ch-1']);
    expect(body.physical_risk_level).toBe('medium');
    expect(body.physical_risk).toBe('Quedas');
  });
});

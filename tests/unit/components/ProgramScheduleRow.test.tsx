import { fireEvent, render, screen } from '@testing-library/react';
import { ProgramScheduleRow } from '@/components/features/programs/ProgramScheduleRow';
import type { ProgramEntry } from '../../../drizzle/schema/programs';
import type { ActivitiesResponse } from '@/hooks/useActivities';

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => undefined,
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));
vi.mock('@dnd-kit/utilities', () => ({ CSS: { Transform: { toString: () => undefined } } }));

const entry = {
  id: 'entry-1',
  program_id: 'p1',
  position: 0,
  start_time: '09:30',
  end_time: '10:00',
  entry_type: 'activity',
  activity_id: 'a1',
  custom_title: null,
  custom_duration_minutes: null,
  created_at: new Date(),
} as ProgramEntry;

const activity = {
  id: 'a1',
  name: 'Jogo do Lenço',
  description: 'd',
  materials: 'm',
  approximate_duration_minutes: 30,
  group_sizes: ['medium'],
  effort_level: 'low',
  locations: ['outside'],
  age_groups: ['scouts'],
  created_at: '2024-01-01T00:00:00Z',
  format: { id: 'f', code: 'jogo', name: 'Jogo' },
  focus: { id: 'o', code: 'cooperacao', name: 'Cooperação' },
  secondary_focus: { id: 's', code: 'lideranca', name: 'Liderança' },
  educational_goals: [],
  sdgs: [],
} as unknown as ActivitiesResponse['activities'][0];

function renderRow(activityProp: ActivitiesResponse['activities'][0] | null) {
  return render(
    <table>
      <tbody>
        <ProgramScheduleRow entry={entry} activity={activityProp} startTime="09:30" endTime="10:00" onEdit={vi.fn()} onDelete={vi.fn()} />
      </tbody>
    </table>
  );
}

describe('ProgramScheduleRow details', () => {
  it('shows the format and the focuses where the activity type used to be', () => {
    renderRow(activity);
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar detalhes' }));

    expect(screen.getByText('Formato:')).toBeInTheDocument();
    expect(screen.getByText('Jogo')).toBeInTheDocument();
    expect(screen.getByText('Foco:')).toBeInTheDocument();
    expect(screen.getByText('Cooperação · Liderança')).toBeInTheDocument();
    expect(screen.queryByText('Tipo:')).not.toBeInTheDocument();
  });

  it('shows only the focus line when the activity has no secondary focus', () => {
    renderRow({ ...activity, secondary_focus: null } as ActivitiesResponse['activities'][0]);
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar detalhes' }));

    expect(screen.getByText('Cooperação')).toBeInTheDocument();
  });
});

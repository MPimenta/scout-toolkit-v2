import { render, screen } from '@testing-library/react';
import { ProgramSummary } from '@/components/features/programs/ProgramSummary';
import { ProgramEntry } from '../../../drizzle/schema/programs';
import { ActivitiesResponse } from '@/hooks/useActivities';

// Mock the IconDisplay component
vi.mock('@/components/ui/IconDisplay', () => ({
  IconDisplay: ({ icon, text, className }: { icon: string; text: string; className: string }) => (
    <span className={className} data-testid="icon-display">
      {icon} {text}
    </span>
  ),
}));

describe('ProgramSummary', () => {
  const mockActivities: ActivitiesResponse['activities'] = [
    {
      id: 'activity-1',
      name: 'Test Activity 1',
      description: 'Test description',
      materials: 'Test materials',
      approximate_duration_minutes: 30,
      group_sizes: ['medium'],
      effort_level: 'low',
      locations: ['outside'],
      age_groups: ['scouts'],
      created_at: '2024-01-01T00:00:00Z',
      activity_types: [{ id: 'type-1', name: 'Game' }],
      educational_goals: [
        {
          id: 'goal-1',
          title: 'Teamwork',
          code: '1S.1',
          age_groups: ['scouts', 'adventurers'],
        }
      ],
      sdgs: [
        {
          id: 'sdg-1',
          number: 17,
          name: 'Partnerships',
          icon_url: 'https://example.com/sdg17.png',
          icon: '🌐'
        }
      ]
    },
    {
      id: 'activity-2',
      name: 'Test Activity 2',
      description: 'Test description 2',
      materials: 'Test materials 2',
      approximate_duration_minutes: 45,
      group_sizes: ['large'],
      effort_level: 'high',
      locations: ['inside'],
      age_groups: ['cub_scouts'],
      created_at: '2024-01-01T00:00:00Z',
      activity_types: [{ id: 'type-2', name: 'Craft' }],
      educational_goals: [
        {
          id: 'goal-2',
          title: 'Creativity',
          code: '2S.1',
          age_groups: ['cub_scouts'],
        }
      ],
      sdgs: [
        {
          id: 'sdg-2',
          number: 4,
          name: 'Quality Education',
          icon_url: 'https://example.com/sdg4.png',
          icon: '📚'
        }
      ]
    }
  ];

  const mockEntries: ProgramEntry[] = [
    {
      id: 'entry-1',
      program_id: 'program-1',
      position: 0,
      start_time: '09:00',
      end_time: '09:30',
      entry_type: 'activity',
      activity_id: 'activity-1',
      custom_title: null,
      custom_duration_minutes: null,
      created_at: new Date('2024-01-01T00:00:00Z')
    },
    {
      id: 'entry-2',
      program_id: 'program-1',
      position: 1,
      start_time: '09:30',
      end_time: '10:15',
      entry_type: 'activity',
      activity_id: 'activity-2',
      custom_title: null,
      custom_duration_minutes: null,
      created_at: new Date('2024-01-01T00:00:00Z')
    },
    {
      id: 'entry-3',
      program_id: 'program-1',
      position: 2,
      start_time: '10:15',
      end_time: '10:45',
      entry_type: 'custom',
      activity_id: null,
      custom_title: 'Break',
      custom_duration_minutes: 30,
      created_at: new Date('2024-01-01T00:00:00Z')
    }
  ];

  it('renders program overview correctly', () => {
    render(
      <ProgramSummary
        entries={mockEntries}
        activities={mockActivities}
        programStartTime="09:00"
        totalDuration={105}
      />
    );

    expect(screen.getByText('Resumo do Programa')).toBeInTheDocument();
    expect(screen.getByText('Duração Total: 1h 45min')).toBeInTheDocument();
    expect(screen.getByText('2 Atividades, 1 Blocos')).toBeInTheDocument();
    expect(screen.getByText('Início:')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
  });

  it('displays educational goals correctly', () => {
    render(
      <ProgramSummary
        entries={mockEntries}
        activities={mockActivities}
        programStartTime="09:00"
        totalDuration={105}
      />
    );

    expect(screen.getByText('Objetivos Educativos')).toBeInTheDocument();
    // Each objective is a pill: its code as text, the division and title in the accessible name.
    expect(screen.getByText('1S.1')).toBeInTheDocument();
    expect(screen.getByText('2S.1')).toBeInTheDocument();
    expect(screen.getByLabelText(/1S.1.*Escoteiros|Escoteiros.*1S.1/)).toBeInTheDocument();
    expect(screen.getByLabelText(/2S.1.*Lobitos|Alcateia.*2S.1|2S.1.*Alcateia/)).toBeInTheDocument();
  });

  it('shows a shared objective once, in each division the program uses it for', () => {
    const shared = { id: 'goal-3', title: 'Orientação', code: '3A.3-4', age_groups: ['adventurers', 'rovers'] };
    const activities = mockActivities.map((activity, index) => ({
      ...activity,
      age_groups: [index === 0 ? 'adventurers' : 'rovers'],
      educational_goals: [shared],
    }));
    render(<ProgramSummary entries={mockEntries} activities={activities} programStartTime="09:00" totalDuration={105} />);

    // One pill per division the program's activities use (Exploradores and Clã), not one per activity.
    expect(screen.getAllByText('3A.3-4')).toHaveLength(2);
    expect(screen.getByLabelText(/3A.3-4.*Exploradores|Exploradores.*3A.3-4/)).toBeInTheDocument();
    expect(screen.getByLabelText(/3A.3-4.*Clã|Clã.*3A.3-4/)).toBeInTheDocument();
  });

  it('displays SDGs correctly', () => {
    render(
      <ProgramSummary
        entries={mockEntries}
        activities={mockActivities}
        programStartTime="09:00"
        totalDuration={105}
      />
    );

    expect(screen.getByText('ODS (Objetivos de Desenvolvimento Sustentável)')).toBeInTheDocument();
    expect(screen.getByText(/17/)).toBeInTheDocument();
    expect(screen.getAllByText(/4/)).toHaveLength(2); // Appears in duration (45 min) and SDG number
  });

  it('displays only program overview, educational goals, and SDGs', () => {
    render(
      <ProgramSummary
        entries={mockEntries}
        activities={mockActivities}
        programStartTime="09:00"
        totalDuration={105}
      />
    );

    // Should have 3 cards: Program Overview, Educational Goals, and SDGs
    expect(screen.getByText('Resumo do Programa')).toBeInTheDocument();
    expect(screen.getByText('Objetivos Educativos')).toBeInTheDocument();
    expect(screen.getByText('ODS (Objetivos de Desenvolvimento Sustentável)')).toBeInTheDocument();
    
    // Should NOT have the activity properties section
    expect(screen.queryByText('Propriedades das Atividades')).not.toBeInTheDocument();
  });

  it('shows empty state when no educational goals', () => {
    const entriesWithoutGoals = mockEntries.map(entry => ({
      ...entry,
      activity_id: null
    }));

    render(
      <ProgramSummary
        entries={entriesWithoutGoals}
        activities={[]}
        programStartTime="09:00"
        totalDuration={30}
      />
    );

    expect(screen.getByText('Nenhum objetivo educativo')).toBeInTheDocument();
    expect(screen.getByText('Nenhum ODS')).toBeInTheDocument();
  });

  it('calculates duration correctly', () => {
    render(
      <ProgramSummary
        entries={mockEntries}
        activities={mockActivities}
        programStartTime="09:00"
        totalDuration={105}
      />
    );

    // 105 minutes = 1h 45min
    expect(screen.getByText('Duração Total: 1h 45min')).toBeInTheDocument();
  });

  it('handles zero duration correctly', () => {
    render(
      <ProgramSummary
        entries={[]}
        activities={[]}
        programStartTime="09:00"
        totalDuration={0}
      />
    );

    expect(screen.getByText('Duração Total: 0h 0min')).toBeInTheDocument();
    expect(screen.getByText('0 Atividades, 0 Blocos')).toBeInTheDocument();
  });
});

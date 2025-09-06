import { render, screen, fireEvent } from '@testing-library/react';
import { ProgramScheduleTable } from '@/components/features/programs/ProgramScheduleTable';
import { ProgramEntry } from '../../../../drizzle/schema/programs';
import { ActivitiesResponse } from '@/hooks/useActivities';

// Mock the ProgramScheduleRow component
vi.mock('@/components/features/programs/ProgramScheduleRow', () => ({
  ProgramScheduleRow: ({ 
    entry, 
    activity, 
    startTime, 
    endTime, 
    onEdit, 
    onDelete 
  }: {
    entry: ProgramEntry;
    activity: any;
    startTime: string;
    endTime: string;
    onEdit: (entry: ProgramEntry) => void;
    onDelete: (id: string) => void;
  }) => (
    <tr data-testid={`schedule-row-${entry.id}`}>
      <td>{startTime}</td>
      <td>{endTime}</td>
      <td>{entry.entry_type === 'activity' ? activity?.name : entry.custom_title}</td>
      <td>
        <button onClick={() => onEdit(entry)} data-testid={`edit-${entry.id}`}>
          Edit
        </button>
        <button onClick={() => onDelete(entry.id)} data-testid={`delete-${entry.id}`}>
          Delete
        </button>
      </td>
    </tr>
  ),
}));

// Mock @dnd-kit components
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: { children: React.ReactNode; onDragEnd: (event: any) => void }) => (
    <div data-testid="dnd-context" onClick={() => onDragEnd({ active: { id: 'entry-1' }, over: { id: 'entry-2' } })}>
      {children}
    </div>
  ),
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  DragEndEvent: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn((items, oldIndex, newIndex) => {
    const newItems = [...items];
    const [removed] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, removed);
    return newItems;
  }),
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
}));

vi.mock('@dnd-kit/modifiers', () => ({
  restrictToVerticalAxis: vi.fn(),
}));

describe('ProgramScheduleTable', () => {
  const mockActivities: ActivitiesResponse['activities'] = [
    {
      id: 'activity-1',
      name: 'Test Activity 1',
      description: 'Test description',
      materials: 'Test materials',
      approximate_duration_minutes: 30,
      group_size: 'medium',
      effort_level: 'low',
      location: 'outside',
      age_group: 'scouts',
      created_at: '2024-01-01T00:00:00Z',
      activity_type: { id: 'type-1', name: 'Game' },
      educational_goals: [],
      sdgs: []
    },
    {
      id: 'activity-2',
      name: 'Test Activity 2',
      description: 'Test description 2',
      materials: 'Test materials 2',
      approximate_duration_minutes: 45,
      group_size: 'large',
      effort_level: 'high',
      location: 'inside',
      age_group: 'cub_scouts',
      created_at: '2024-01-01T00:00:00Z',
      activity_type: { id: 'type-2', name: 'Craft' },
      educational_goals: [],
      sdgs: []
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

  const mockOnReorder = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table with correct headers', () => {
    render(
      <ProgramScheduleTable
        entries={mockEntries}
        activities={mockActivities}
        programStartTime="09:00"
        onReorder={mockOnReorder}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Fim')).toBeInTheDocument();
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Duração')).toBeInTheDocument();
    expect(screen.getByText('Ações')).toBeInTheDocument();
  });

  it('renders all entries as rows', () => {
    render(
      <ProgramScheduleTable
        entries={mockEntries}
        activities={mockActivities}
        programStartTime="09:00"
        onReorder={mockOnReorder}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByTestId('schedule-row-entry-1')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-row-entry-2')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-row-entry-3')).toBeInTheDocument();
  });

  it('calculates start and end times correctly', () => {
    render(
      <ProgramScheduleTable
        entries={mockEntries}
        activities={mockActivities}
        programStartTime="09:00"
        onReorder={mockOnReorder}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // First entry should start at program start time
    expect(screen.getByText('09:00')).toBeInTheDocument();
    // Second entry should start after first entry duration (appears twice - start and end)
    expect(screen.getAllByText('09:30')).toHaveLength(2);
    // Third entry should start after second entry duration (appears twice - start and end)
    expect(screen.getAllByText('10:15')).toHaveLength(2);
  });

  it('handles drag and drop reordering', () => {
    render(
      <ProgramScheduleTable
        entries={mockEntries}
        activities={mockActivities}
        programStartTime="09:00"
        onReorder={mockOnReorder}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const dndContext = screen.getByTestId('dnd-context');
    fireEvent.click(dndContext);

    expect(mockOnReorder).toHaveBeenCalled();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <ProgramScheduleTable
        entries={mockEntries}
        activities={mockActivities}
        programStartTime="09:00"
        onReorder={mockOnReorder}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByTestId('edit-entry-1');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockEntries[0]);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <ProgramScheduleTable
        entries={mockEntries}
        activities={mockActivities}
        programStartTime="09:00"
        onReorder={mockOnReorder}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByTestId('delete-entry-1');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('entry-1');
  });

  it('displays activity names for activity entries', () => {
    render(
      <ProgramScheduleTable
        entries={mockEntries}
        activities={mockActivities}
        programStartTime="09:00"
        onReorder={mockOnReorder}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test Activity 1')).toBeInTheDocument();
    expect(screen.getByText('Test Activity 2')).toBeInTheDocument();
  });

  it('displays custom titles for custom entries', () => {
    render(
      <ProgramScheduleTable
        entries={mockEntries}
        activities={mockActivities}
        programStartTime="09:00"
        onReorder={mockOnReorder}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Break')).toBeInTheDocument();
  });

  it('handles empty entries array', () => {
    render(
      <ProgramScheduleTable
        entries={[]}
        activities={mockActivities}
        programStartTime="09:00"
        onReorder={mockOnReorder}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Nenhuma entrada no programa ainda.')).toBeInTheDocument();
    expect(screen.queryByTestId(/schedule-row-/)).not.toBeInTheDocument();
  });

  it('handles missing activities gracefully', () => {
    const entriesWithMissingActivity = [
      {
        ...mockEntries[0],
        activity_id: 'non-existent-activity'
      }
    ];

    render(
      <ProgramScheduleTable
        entries={entriesWithMissingActivity}
        activities={mockActivities}
        programStartTime="09:00"
        onReorder={mockOnReorder}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByTestId('schedule-row-entry-1')).toBeInTheDocument();
  });
});

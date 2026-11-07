import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ProgramBuilder } from '@/components/features/programs/ProgramBuilder';
import type { ProgramEntry } from '@/hooks/useProgram';

// Mock the hooks and components
vi.mock('@/hooks/useProgramMutations', () => ({
  useProgramMutations: () => ({
    updateProgram: vi.fn(),
    deleteProgram: vi.fn(),
  }),
}));

vi.mock('@/components/features/programs/ExportButton', () => ({
  ExportButton: () => <button type="button">Exportar Excel</button>,
}));

vi.mock('@/components/features/programs/PDFExportButton', () => ({
  PDFExportButton: () => <button type="button">Exportar PDF</button>,
}));

vi.mock('@/components/features/programs/EditProgramModal', () => ({
  EditProgramModal: () => null,
}));

vi.mock('@/components/features/programs/DeleteProgramModal', () => ({
  DeleteProgramModal: () => null,
}));

vi.mock('@/hooks/useActivities', () => ({
  useActivities: () => ({
    activities: [],
    loading: false,
    error: null,
  }),
  useAllActivities: () => ({
    activities: [],
    loading: false,
    error: null,
  }),
}));

vi.mock('@/components/features/programs/AddActivityModal', () => ({
  AddActivityModal: ({ open, onClose, onAdd }: any) => (
    open ? (
      <div data-testid="add-activity-modal">
        <button onClick={() => onAdd(mockActivity)}>Add Mock Activity</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

vi.mock('@/components/features/programs/AddCustomBlockModal', () => ({
  AddCustomBlockModal: ({ open, onClose, onAdd }: any) => (
    open ? (
      <div data-testid="add-custom-modal">
        <button onClick={() => onAdd('Custom Break', 30)}>Add Custom Block</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

vi.mock('@/components/features/programs/ProgramScheduleTable', () => ({
  ProgramScheduleTable: ({ entries, onEdit, onDelete }: any) => (
    <div data-testid="schedule-table">
      {entries.map((entry: any, index: number) => (
        <div key={entry.id} data-testid={`entry-${index}`}>
          <span>{entry.entry_type === 'activity' ? 'Activity' : 'Custom'}</span>
          <button onClick={() => onDelete(entry.id)}>Remove</button>
          <button onClick={() => onEdit(entry)}>Update Time</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/features/programs/ProgramSummary', () => ({
  ProgramSummary: ({ totalDuration, programStartTime }: any) => (
    <div data-testid="program-summary">
      <span>Start: {programStartTime}</span>
      <span>Total: {Math.floor(totalDuration / 60)}h {totalDuration % 60}min</span>
    </div>
  ),
}));

// Mock data
const mockActivity = {
  id: 'activity-1',
  title: 'Test Activity',
  description: 'A test activity',
  duration_minutes: 30,
  location: 'Outside',
  min_participants: 5,
  max_participants: 20,
  activity_type: 'Game',
  educational_goals: ['Leadership'],
  sdgs: ['SDG4'],
  created_at: new Date(),
  updated_at: new Date(),
  user_id: 'user-1',
  is_public: true,
};

const mockEntries: ProgramEntry[] = [
  {
    id: 'entry-1',
    position: 0,
    start_time: '09:00',
    end_time: '09:30',
    entry_type: 'activity',
    activity: {
      id: 'activity-1',
      name: 'Test Activity',
      approximate_duration_minutes: 30,
      group_sizes: ['medium'],
      effort_level: 'low',
      locations: ['inside'],
      activity_types: [{ name: 'Jogo' }],
    },
  },
  {
    id: 'entry-2',
    position: 1,
    start_time: '09:30',
    end_time: '10:00',
    entry_type: 'custom',
    custom_title: 'Break',
    custom_duration_minutes: 30,
  },
];

const mockProgram = {
  id: 'program-1',
  name: 'Programa de Teste',
  date: '2026-04-12',
  start_time: '09:00',
  is_public: false,
  user: { name: 'Chefe Ana', id: 'user-1' },
  created_at: '2026-04-01T10:00:00.000Z',
  updated_at: '2026-04-01T10:00:00.000Z',
};

describe('ProgramBuilder', () => {
  const defaultProps = {
    programId: 'program-1',
    program: mockProgram,
    initialEntries: [] as ProgramEntry[],
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('confirm', vi.fn(() => false));
    vi.stubGlobal('prompt', vi.fn(() => null));
  });

  it('renders program builder interface', () => {
    render(<ProgramBuilder {...defaultProps} />);
    
    expect(screen.getByText('Programa de Teste')).toBeInTheDocument();
    expect(screen.getByText('Horário do programa')).toBeInTheDocument();
    expect(screen.getByText(/As alterações ficam guardadas/)).toBeInTheDocument();
    expect(screen.getByText('Adicionar Atividade')).toBeInTheDocument();
    expect(screen.getByText('Adicionar Bloco Personalizado')).toBeInTheDocument();
    expect(screen.getByText('Exportar Excel')).toBeInTheDocument();
    expect(screen.getByText('Exportar PDF')).toBeInTheDocument();
  });

  it('shows empty state when no entries', () => {
    render(<ProgramBuilder {...defaultProps} />);

    // With the new implementation, empty state is handled by the schedule table
    expect(screen.getByTestId('schedule-table')).toBeInTheDocument();
    expect(screen.getByTestId('program-summary')).toBeInTheDocument();
  });

  it('displays existing entries', () => {
    render(<ProgramBuilder {...defaultProps} initialEntries={mockEntries} />);
    
    expect(screen.getByTestId('entry-0')).toBeInTheDocument();
    expect(screen.getByTestId('entry-1')).toBeInTheDocument();
    expect(screen.getByText('Activity')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('opens add activity modal when Add Activity button is clicked', () => {
    render(<ProgramBuilder {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Adicionar Atividade'));
    expect(screen.getByTestId('add-activity-modal')).toBeInTheDocument();
  });

  it('opens add custom block modal when Add Custom Block button is clicked', () => {
    render(<ProgramBuilder {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Adicionar Bloco Personalizado'));
    expect(screen.getByTestId('add-custom-modal')).toBeInTheDocument();
  });

  it('adds activity when selected from modal', async () => {
    render(<ProgramBuilder {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Adicionar Atividade'));
    fireEvent.click(screen.getByText('Add Mock Activity'));
    
    await waitFor(() => {
      expect(screen.queryByTestId('add-activity-modal')).not.toBeInTheDocument();
    });
    
    // Should now show the activity entry
    expect(screen.getByTestId('entry-0')).toBeInTheDocument();
  });

  it('adds custom block when created', async () => {
    render(<ProgramBuilder {...defaultProps} />);
    
    // Click the Add Custom Block button (first one - the main button)
    fireEvent.click(screen.getByText('Adicionar Bloco Personalizado'));
    fireEvent.click(screen.getByText('Add Custom Block'));
    
    await waitFor(() => {
      expect(screen.queryByTestId('add-custom-modal')).not.toBeInTheDocument();
    });
    
    // Should now show the custom block entry
    expect(screen.getByTestId('entry-0')).toBeInTheDocument();
  });

  it('removes entry when remove button is clicked', () => {
    render(<ProgramBuilder {...defaultProps} initialEntries={mockEntries} />);
    
    // Should have two entries initially
    expect(screen.getByTestId('entry-0')).toBeInTheDocument();
    expect(screen.getByTestId('entry-1')).toBeInTheDocument();
    
    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);
    
    // Should only have one entry left (and it gets re-indexed to 0)
    expect(screen.getByTestId('entry-0')).toBeInTheDocument();
    expect(screen.queryByTestId('entry-1')).not.toBeInTheDocument();
  });

  it('updates entry when update button is clicked', () => {
    render(<ProgramBuilder {...defaultProps} initialEntries={mockEntries} />);
    
    const updateButtons = screen.getAllByText('Update Time');
    fireEvent.click(updateButtons[0]);
    
    // Entry should be updated (we can't easily test the internal state change)
    // but the component should still render
    expect(screen.getByTestId('entry-0')).toBeInTheDocument();
  });

  it('calculates total duration correctly', () => {
    render(<ProgramBuilder {...defaultProps} initialEntries={mockEntries} />);
    
    // First entry: 09:00-09:30 = 30min
    // Second entry: 09:30-10:00 = 30min
    // Total: 60min = 1h
    expect(screen.getByText('1h 0min')).toBeInTheDocument();
    expect(screen.getByText(/Total: 1h 0min/)).toBeInTheDocument();
  });

  it('starts the schedule at the program start time, not 09:00', () => {
    render(
      <ProgramBuilder
        {...defaultProps}
        program={{ ...mockProgram, start_time: '09:30:00' }}
        initialEntries={[
          { ...mockEntries[0]!, activity: { ...mockEntries[0]!.activity!, approximate_duration_minutes: 90 } },
          { ...mockEntries[1]!, custom_duration_minutes: 15 },
        ]}
      />
    );
    expect(screen.getByText('Start: 09:30')).toBeInTheDocument();
    expect(screen.getByText(/Total: 1h 45min/)).toBeInTheDocument();
  });

  it('has no separate save button (changes are saved as they happen)', () => {
    render(<ProgramBuilder {...defaultProps} />);
    expect(screen.queryByText('Save Program')).not.toBeInTheDocument();
  });

  it('shows creation in progress instead of a link while the Orgo event is being created', () => {
    render(
      <ProgramBuilder
        {...defaultProps}
        program={{ ...mockProgram, orgo_event_pending: true, orgo_event_uuid: null, orgo_event_url: null }}
      />
    );
    const button = screen.getByRole('button', { name: 'A criar o evento no eAEP…' });
    expect(button).toBeDisabled();
    expect(screen.queryByRole('link', { name: /ver evento no eaep/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Criar evento no eAEP' })).not.toBeInTheDocument();
  });
});

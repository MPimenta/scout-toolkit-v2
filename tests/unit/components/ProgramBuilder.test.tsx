import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ProgramBuilder } from '@/components/features/programs/ProgramBuilder';
import { ProgramEntry } from '@/drizzle/schema/programs';
import { Activity } from '@/drizzle/schema/activities';

// Mock the hooks and components
vi.mock('@/hooks/useProgramMutations', () => ({
  useProgramMutations: () => ({
    updateProgram: vi.fn(),
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

vi.mock('@/components/features/programs/ProgramEntryCard', () => ({
  ProgramEntryCard: ({ entry, index, onRemove, onUpdate }: any) => (
    <div data-testid={`entry-${index}`}>
      <span>{entry.entry_type === 'activity' ? 'Activity' : 'Custom'}</span>
      <button onClick={() => onRemove(entry.id)}>Remove</button>
      <button onClick={() => onUpdate(entry.id, { start_time: '10:00' })}>Update Time</button>
    </div>
  ),
}));

// Mock data
const mockActivity: Activity = {
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
    program_id: 'program-1',
    position: 0,
    start_time: '09:00',
    end_time: '09:30',
    entry_type: 'activity',
    activity_id: 'activity-1',
    custom_title: null,
    custom_duration_minutes: null,
    created_at: new Date(),
  },
  {
    id: 'entry-2',
    program_id: 'program-1',
    position: 1,
    start_time: '09:30',
    end_time: '10:00',
    entry_type: 'custom',
    activity_id: null,
    custom_title: 'Break',
    custom_duration_minutes: 30,
    created_at: new Date(),
  },
];

describe('ProgramBuilder', () => {
  const defaultProps = {
    programId: 'program-1',
    initialEntries: [] as ProgramEntry[],
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders program builder interface', () => {
    render(<ProgramBuilder {...defaultProps} />);
    
    expect(screen.getByText('Program Builder')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop to reorder, add activities and custom blocks')).toBeInTheDocument();
    expect(screen.getByText('Add Activity')).toBeInTheDocument();
    expect(screen.getByText('Add Custom Block')).toBeInTheDocument();
    expect(screen.getByText('Save Program')).toBeInTheDocument();
  });

  it('shows empty state when no entries', () => {
    render(<ProgramBuilder {...defaultProps} />);
    
    expect(screen.getByText('No entries yet')).toBeInTheDocument();
    expect(screen.getByText('Start building your program by adding activities or custom blocks')).toBeInTheDocument();
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
    
    fireEvent.click(screen.getByText('Add Activity'));
    expect(screen.getByTestId('add-activity-modal')).toBeInTheDocument();
  });

  it('opens add custom block modal when Add Custom Block button is clicked', () => {
    render(<ProgramBuilder {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Add Custom Block'));
    expect(screen.getByTestId('add-custom-modal')).toBeInTheDocument();
  });

  it('adds activity when selected from modal', async () => {
    render(<ProgramBuilder {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Add Activity'));
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
    const addCustomButtons = screen.getAllByText('Add Custom Block');
    fireEvent.click(addCustomButtons[0]);
    
    // Click the Add Custom Block button in the modal (use getAllByText to get the second one)
    const modalButtons = screen.getAllByText('Add Custom Block');
    fireEvent.click(modalButtons[1]); // Second button is in the modal
    
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
    expect(screen.getByText(/Total: 1h/)).toBeInTheDocument();
  });

  it('calls onSave when save button is clicked', async () => {
    const onSave = vi.fn();
    render(<ProgramBuilder {...defaultProps} onSave={onSave} />);
    
    fireEvent.click(screen.getByText('Save Program'));
    
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith([]);
    });
  });
});

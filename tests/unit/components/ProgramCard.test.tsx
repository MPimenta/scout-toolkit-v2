import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProgramCard } from '@/components/features/programs/ProgramCard';

// Mock the hooks
vi.mock('@/hooks/useProgramMutations', () => ({
  useProgramMutations: () => ({
    deleteProgram: vi.fn(),
  }),
}));

const mockProgram = {
  id: '1',
  name: 'Test Program',
  date: '2024-01-15',
  start_time: '09:00',
  is_public: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  entry_count: 5,
  total_duration_minutes: 120,
};

describe('ProgramCard', () => {
  it('renders program information correctly', () => {
    render(<ProgramCard program={mockProgram} onDelete={vi.fn()} />);
    
    expect(screen.getByText('Test Program')).toBeInTheDocument();
    expect(screen.getByText('15/01/2024')).toBeInTheDocument();
    expect(screen.getByText('Início: 09:00')).toBeInTheDocument();
    expect(screen.getByText('5 entradas')).toBeInTheDocument();
    expect(screen.getByText('Duração: 2h')).toBeInTheDocument();
  });

  it('shows public badge when program is public', () => {
    const publicProgram = { ...mockProgram, is_public: true };
    render(<ProgramCard program={publicProgram} onDelete={vi.fn()} />);
    
    expect(screen.getByText('Público')).toBeInTheDocument();
  });

  it('shows private badge when program is not public', () => {
    const privateProgram = { ...mockProgram, entry_count: 0 };
    render(<ProgramCard program={privateProgram} onDelete={vi.fn()} />);
    
    expect(screen.getByText('Vazio')).toBeInTheDocument();
  });

  it('opens delete confirmation modal when delete button is clicked', () => {
    const mockOnDelete = vi.fn();
    render(<ProgramCard program={mockProgram} onDelete={mockOnDelete} />);
    
    const deleteButton = screen.getByRole('button', { name: /eliminar programa/i });
    fireEvent.click(deleteButton);
    
    // Modal should be open
    expect(screen.getByText(/tem a certeza que deseja eliminar o programa/i)).toBeInTheDocument();
    // Check that the modal title is present
    expect(screen.getByRole('heading', { name: /eliminar programa/i })).toBeInTheDocument();
    // Check that the confirmation text mentions the program
    expect(screen.getByText(/tem a certeza que deseja eliminar o programa/i)).toBeInTheDocument();
    
    // onDelete should not be called yet (only when confirmed)
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('calls onDelete when deletion is confirmed in modal', () => {
    const mockOnDelete = vi.fn();
    render(<ProgramCard program={mockProgram} onDelete={mockOnDelete} />);
    
    // Open delete modal
    const deleteButton = screen.getByRole('button', { name: /eliminar programa/i });
    fireEvent.click(deleteButton);
    
    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /eliminar programa/i });
    fireEvent.click(confirmButton);
    
    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('navigates to program details when view button is clicked', () => {
    render(<ProgramCard program={mockProgram} onDelete={vi.fn()} />);
    
    const viewLink = screen.getByRole('link', { name: /ver programa/i });
    expect(viewLink).toBeInTheDocument();
    expect(viewLink).toHaveAttribute('href', '/programs/1');
  });

  it('navigates to program edit when edit button is clicked', () => {
    render(<ProgramCard program={mockProgram} onDelete={vi.fn()} />);
    
    const editLink = screen.getByRole('link', { name: /editar programa/i });
    expect(editLink).toBeInTheDocument();
    expect(editLink).toHaveAttribute('href', '/programs/1/edit');
  });

  it('displays correct duration format for different durations', () => {
    const shortProgram = { ...mockProgram, total_duration_minutes: 45 };
    render(<ProgramCard program={shortProgram} onDelete={vi.fn()} />);
    
    expect(screen.getByText('Duração: 45min')).toBeInTheDocument();
  });

  it('displays correct entry count text', () => {
    const singleActivityProgram = { ...mockProgram, entry_count: 1 };
    render(<ProgramCard program={singleActivityProgram} onDelete={vi.fn()} />);
    
    expect(screen.getByText('1 entradas')).toBeInTheDocument();
  });
});

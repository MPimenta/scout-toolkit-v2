import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EditProgramModal } from '@/components/features/programs/EditProgramModal';
import { useProgramMutations } from '@/hooks/useProgramMutations';
import { toast } from 'sonner';

// Mock the useProgramMutations hook
vi.mock('@/hooks/useProgramMutations', () => ({
  useProgramMutations: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the log utility
vi.mock('@/lib/errors', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EditProgramModal', () => {
  const mockProgram = {
    id: 'test-program-id',
    name: 'Test Program',
    date: '2025-01-01',
    start_time: '09:00',
    is_public: false,
  };

  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useProgramMutations as any).mockReturnValue({
      updateProgram: vi.fn(),
    });
  });

  it('renders modal with program data when open', () => {
    render(
      <EditProgramModal
        isOpen={true}
        onClose={mockOnClose}
        program={mockProgram}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Editar Programa')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Program')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2025-01-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <EditProgramModal
        isOpen={false}
        onClose={mockOnClose}
        program={mockProgram}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByText('Editar Programa')).not.toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <EditProgramModal
        isOpen={true}
        onClose={mockOnClose}
        program={mockProgram}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('validates required fields', async () => {
    render(
      <EditProgramModal
        isOpen={true}
        onClose={mockOnClose}
        program={mockProgram}
        onSuccess={mockOnSuccess}
      />
    );

    const nameInput = screen.getByDisplayValue('Test Program');
    fireEvent.change(nameInput, { target: { value: '' } });

    const submitButton = screen.getByText('Guardar Alterações');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Nome do programa é obrigatório')).toBeInTheDocument();
    });
  });

  it('submits form with updated data', async () => {
    const mockUpdateProgram = vi.fn().mockResolvedValue(undefined);
    (useProgramMutations as any).mockReturnValue({
      updateProgram: mockUpdateProgram,
    });

    render(
      <EditProgramModal
        isOpen={true}
        onClose={mockOnClose}
        program={mockProgram}
        onSuccess={mockOnSuccess}
      />
    );

    const nameInput = screen.getByDisplayValue('Test Program');
    fireEvent.change(nameInput, { target: { value: 'Updated Program' } });

    const submitButton = screen.getByText('Guardar Alterações');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateProgram).toHaveBeenCalledWith('test-program-id', {
        name: 'Updated Program',
        date: '2025-01-01',
        start_time: '09:00',
        is_public: false,
      });
    });

    expect(toast.success).toHaveBeenCalledWith('Programa atualizado com sucesso!', {
      description: 'As alterações foram salvas.',
    });
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles form submission errors', async () => {
    const error = new Error('Update failed');
    const mockUpdateProgram = vi.fn().mockRejectedValue(error);
    (useProgramMutations as any).mockReturnValue({
      updateProgram: mockUpdateProgram,
    });

    render(
      <EditProgramModal
        isOpen={true}
        onClose={mockOnClose}
        program={mockProgram}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByText('Guardar Alterações');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erro ao atualizar programa', {
        description: 'Update failed',
      });
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('toggles public status', () => {
    render(
      <EditProgramModal
        isOpen={true}
        onClose={mockOnClose}
        program={mockProgram}
        onSuccess={mockOnSuccess}
      />
    );

    const publicSwitch = screen.getByRole('switch');
    expect(publicSwitch).not.toBeChecked();

    fireEvent.click(publicSwitch);
    expect(publicSwitch).toBeChecked();
  });

  it('shows loading state during submission', async () => {
    const mockUpdateProgram = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    (useProgramMutations as any).mockReturnValue({
      updateProgram: mockUpdateProgram,
    });

    render(
      <EditProgramModal
        isOpen={true}
        onClose={mockOnClose}
        program={mockProgram}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByText('Guardar Alterações');
    fireEvent.click(submitButton);

    expect(screen.getByText('A guardar...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});

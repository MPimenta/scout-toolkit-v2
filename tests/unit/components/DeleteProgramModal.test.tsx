import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeleteProgramModal } from '@/components/features/programs/DeleteProgramModal';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('DeleteProgramModal', () => {
  const mockOnConfirm = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders delete confirmation modal when open', () => {
    render(
      <DeleteProgramModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        programName="Test Program"
      />
    );

    expect(screen.getByRole('heading', { name: 'Eliminar Programa' })).toBeInTheDocument();
    expect(screen.getByText(/tem a certeza que deseja eliminar o programa/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Program/)).toBeInTheDocument();
    expect(screen.getByText(/esta ação não pode ser desfeita/i)).toBeInTheDocument();
  });

  it('calls onConfirm when delete button is clicked', () => {
    render(
      <DeleteProgramModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        programName="Test Program"
      />
    );

    const deleteButton = screen.getByRole('button', { name: /eliminar programa/i });
    fireEvent.click(deleteButton);

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <DeleteProgramModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        programName="Test Program"
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onClose when escape key is pressed', () => {
    render(
      <DeleteProgramModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        programName="Test Program"
      />
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays program name correctly', () => {
    render(
      <DeleteProgramModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        programName="Test Program"
      />
    );

    expect(screen.getByText(/Test Program/)).toBeInTheDocument();
  });

  it('has proper button roles and accessibility', () => {
    render(
      <DeleteProgramModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        programName="Test Program"
      />
    );

    expect(screen.getByRole('button', { name: /eliminar programa/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('handles programs with special characters in name', () => {
    render(
      <DeleteProgramModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        programName='Programa com "aspas" e caracteres especiais'
      />
    );

    expect(screen.getByText(/Programa com "aspas" e caracteres especiais/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <DeleteProgramModal
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        programName="Test Program"
      />
    );

    expect(screen.queryByText(/eliminar programa/i)).not.toBeInTheDocument();
  });
});

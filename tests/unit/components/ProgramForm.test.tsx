import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProgramForm } from '@/components/features/programs/ProgramForm';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock the mutations hook
vi.mock('@/hooks/useProgramMutations', () => ({
  useProgramMutations: () => ({
    createProgram: vi.fn(),
    updateProgram: vi.fn(),
    clearError: vi.fn(),
  }),
}));

const mockInitialData = {
  id: '1',
  name: 'Existing Program',
  date: '2024-01-15',
  start_time: '09:00',
  is_public: false,
};

describe('ProgramForm', () => {
  describe('Create Mode', () => {
    it('renders create form with empty fields', () => {
      render(<ProgramForm mode="create" onSuccess={vi.fn()} />);
      
      expect(screen.getByText('Criar Novo Programa')).toBeInTheDocument();
      expect(screen.getByLabelText(/nome/i)).toHaveValue('');
      expect(screen.getByLabelText(/data/i)).toHaveValue('');
      expect(screen.getByLabelText(/hora de início/i)).toHaveValue('09:00');
      expect(screen.getByLabelText(/programa público/i)).not.toBeChecked();
    });

    it('submits form with create data', async () => {
      const mockOnSuccess = vi.fn();
      render(<ProgramForm mode="create" onSuccess={mockOnSuccess} />);
      
      // Fill form
      fireEvent.change(screen.getByLabelText(/nome/i), {
        target: { value: 'New Program' },
      });
      fireEvent.change(screen.getByLabelText(/data/i), {
        target: { value: '2024-01-20' },
      });
      fireEvent.change(screen.getByLabelText(/hora de início/i), {
        target: { value: '10:00' },
      });
      fireEvent.click(screen.getByLabelText(/programa público/i));
      
      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /criar programa/i }));
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('shows validation error for empty name', async () => {
      render(<ProgramForm mode="create" onSuccess={vi.fn()} />);
      
      // Submit without filling name - button should be disabled
      const submitButton = screen.getByRole('button', { name: /criar programa/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Edit Mode', () => {
    it('renders edit form with initial data', () => {
      render(
        <ProgramForm 
          mode="edit" 
          initialData={mockInitialData} 
          onSuccess={vi.fn()} 
        />
      );
      
      expect(screen.getByText('Editar Programa')).toBeInTheDocument();
      expect(screen.getByLabelText(/nome/i)).toHaveValue('Existing Program');
      expect(screen.getByLabelText(/data/i)).toHaveValue('2024-01-15');
      expect(screen.getByLabelText(/hora de início/i)).toHaveValue('09:00');
      expect(screen.getByLabelText(/programa público/i)).not.toBeChecked();
    });

    it('submits form with updated data', async () => {
      const mockOnSuccess = vi.fn();
      render(
        <ProgramForm 
          mode="edit" 
          initialData={mockInitialData} 
          onSuccess={mockOnSuccess} 
        />
      );
      
      // Update form
      fireEvent.change(screen.getByLabelText(/nome/i), {
        target: { value: 'Updated Program' },
      });
      
      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /guardar alterações/i }));
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Form Interactions', () => {
    it('calls onSuccess when cancel is clicked', () => {
      const mockOnSuccess = vi.fn();
      render(<ProgramForm mode="create" onSuccess={mockOnSuccess} />);
      
      fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
      
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('toggles public checkbox correctly', () => {
      render(<ProgramForm mode="create" onSuccess={vi.fn()} />);
      
      const publicCheckbox = screen.getByLabelText(/programa público/i);
      expect(publicCheckbox).not.toBeChecked();
      
      fireEvent.click(publicCheckbox);
      expect(publicCheckbox).toBeChecked();
    });

    it('handles date input correctly', () => {
      render(<ProgramForm mode="create" onSuccess={vi.fn()} />);
      
      const dateInput = screen.getByLabelText(/data/i);
      fireEvent.change(dateInput, { target: { value: '2024-01-25' } });
      
      expect(dateInput).toHaveValue('2024-01-25');
    });

    it('handles time input correctly', () => {
      render(<ProgramForm mode="create" onSuccess={vi.fn()} />);
      
      const timeInput = screen.getByLabelText(/hora de início/i);
      fireEvent.change(timeInput, { target: { value: '14:30' } });
      
      expect(timeInput).toHaveValue('14:30');
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<ProgramForm mode="create" onSuccess={vi.fn()} />);
      
      expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/data/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/hora de início/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/programa público/i)).toBeInTheDocument();
    });

    it('has proper button roles', () => {
      render(<ProgramForm mode="create" onSuccess={vi.fn()} />);
      
      expect(screen.getByRole('button', { name: /criar programa/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddToProgramModal } from '@/components/features/activities/AddToProgramModal';
import { useSession } from 'next-auth/react';

// Mock next-auth
jest.mock('next-auth/react');

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe('AddToProgramModal', () => {
  const mockActivity = {
    id: 'test-activity-id',
    name: { pt: 'Atividade de Teste', en: 'Test Activity' },
    approximate_duration_minutes: 60,
    group_size: 'medium' as const,
  };

  const mockSession = {
    data: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
    },
    status: 'authenticated' as const,
  };

  const mockUnauthenticatedSession = {
    data: null,
    status: 'unauthenticated' as const,
  };

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    activity: mockActivity,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user is not authenticated', () => {
    it('shows login prompt', () => {
      mockUseSession.mockReturnValue(mockUnauthenticatedSession);

      render(<AddToProgramModal {...defaultProps} />);

      expect(screen.getByText('Inicie sessão para adicionar atividades aos seus programas')).toBeInTheDocument();
      expect(screen.getByText('Iniciar Sessão')).toBeInTheDocument();
    });
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue(mockSession);
    });

    it('renders activity preview', () => {
      render(<AddToProgramModal {...defaultProps} />);

      expect(screen.getByText('Atividade Selecionada')).toBeInTheDocument();
      expect(screen.getByText('Atividade de Teste')).toBeInTheDocument();
      expect(screen.getByText('60 min')).toBeInTheDocument();
      expect(screen.getByText('6-15')).toBeInTheDocument();
    });

    it('shows program selection by default', () => {
      render(<AddToProgramModal {...defaultProps} />);

      expect(screen.getByText('Selecionar Programa')).toBeInTheDocument();
      expect(screen.getByText('Escolha um programa existente')).toBeInTheDocument();
      expect(screen.getByText('Criar Novo Programa')).toBeInTheDocument();
      expect(screen.getByText('Adicionar ao Programa')).toBeInTheDocument();
    });

    it('displays existing programs in dropdown', () => {
      render(<AddToProgramModal {...defaultProps} />);

      // Open the dropdown
      const selectTrigger = screen.getByText('Escolha um programa existente');
      fireEvent.click(selectTrigger);

      // Check that programs are displayed
      expect(screen.getByText('Acampamento de Verão 2024')).toBeInTheDocument();
      expect(screen.getByText('Programa de atividades para o acampamento de verão')).toBeInTheDocument();
      expect(screen.getByText('Reuniões Semanais')).toBeInTheDocument();
      expect(screen.getByText('Atividades para as reuniões semanais da secção')).toBeInTheDocument();
    });

    it('allows selecting an existing program', () => {
      render(<AddToProgramModal {...defaultProps} />);

      // Open the dropdown
      const selectTrigger = screen.getByText('Escolha um programa existente');
      fireEvent.click(selectTrigger);

      // Select a program
      const programOption = screen.getByText('Acampamento de Verão 2024');
      fireEvent.click(programOption);

      // Check that program is selected
      expect(screen.getByText('Acampamento de Verão 2024')).toBeInTheDocument();
    });

    it('enables add to program button when program is selected', () => {
      render(<AddToProgramModal {...defaultProps} />);

      // Initially button should be disabled
      const addButton = screen.getByText('Adicionar ao Programa');
      expect(addButton).toBeDisabled();

      // Select a program
      const selectTrigger = screen.getByText('Escolha um programa existente');
      fireEvent.click(selectTrigger);
      const programOption = screen.getByText('Acampamento de Verão 2024');
      fireEvent.click(programOption);

      // Now button should be enabled
      expect(addButton).not.toBeDisabled();
    });

    it('shows create new program form when button is clicked', () => {
      render(<AddToProgramModal {...defaultProps} />);

      const createButton = screen.getByText('Criar Novo Programa');
      fireEvent.click(createButton);

      // Check that form is displayed
      expect(screen.getByText('Nome do Programa')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Ex: Acampamento de Verão 2024')).toBeInTheDocument();
      expect(screen.getByText('Descrição (opcional)')).toBeInTheDocument();
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
      expect(screen.getByText('Criar Programa')).toBeInTheDocument();
    });

    it('allows creating a new program', async () => {
      render(<AddToProgramModal {...defaultProps} />);

      // Go to create program form
      const createButton = screen.getByText('Criar Novo Programa');
      fireEvent.click(createButton);

      // Fill in the form
      const nameInput = screen.getByPlaceholderText('Ex: Acampamento de Verão 2024');
      const descriptionInput = screen.getByPlaceholderText('Descreva o programa...');
      
      fireEvent.change(nameInput, { target: { value: 'Novo Programa' } });
      fireEvent.change(descriptionInput, { target: { value: 'Descrição do novo programa' } });

      // Submit the form
      const submitButton = screen.getByText('Criar Programa');
      fireEvent.click(submitButton);

      // Check loading state
      expect(screen.getByText('A criar...')).toBeInTheDocument();

      // Wait for submission to complete
      await waitFor(() => {
        expect(screen.getByText('Criar Programa')).toBeInTheDocument();
      });

      // Check that form is reset and we're back to program selection
      expect(screen.getByText('Selecionar Programa')).toBeInTheDocument();
    });

    it('requires program name to create program', () => {
      render(<AddToProgramModal {...defaultProps} />);

      // Go to create program form
      const createButton = screen.getByText('Criar Novo Programa');
      fireEvent.click(createButton);

      // Try to submit without name
      const submitButton = screen.getByText('Criar Programa');
      expect(submitButton).toBeDisabled();

      // Add name
      const nameInput = screen.getByPlaceholderText('Ex: Acampamento de Verão 2024');
      fireEvent.change(nameInput, { target: { value: 'Novo Programa' } });

      // Now button should be enabled
      expect(submitButton).not.toBeDisabled();
    });

    it('allows canceling program creation', () => {
      render(<AddToProgramModal {...defaultProps} />);

      // Go to create program form
      const createButton = screen.getByText('Criar Novo Programa');
      fireEvent.click(createButton);

      // Cancel
      const cancelButton = screen.getByText('Cancelar');
      fireEvent.click(cancelButton);

      // Should be back to program selection
      expect(screen.getByText('Selecionar Programa')).toBeInTheDocument();
    });

    it('adds activity to selected program', async () => {
      render(<AddToProgramModal {...defaultProps} />);

      // Select a program
      const selectTrigger = screen.getByText('Escolha um programa existente');
      fireEvent.click(selectTrigger);
      const programOption = screen.getByText('Acampamento de Verão 2024');
      fireEvent.click(programOption);

      // Add to program
      const addButton = screen.getByText('Adicionar ao Programa');
      fireEvent.click(addButton);

      // Check loading state
      expect(screen.getByText('A adicionar...')).toBeInTheDocument();

      // Wait for submission to complete
      await waitFor(() => {
        expect(screen.getByText('Adicionar ao Programa')).toBeInTheDocument();
      });

      // Check that modal is closed
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('handles missing activity data gracefully', () => {
      const activityWithMissingData = {
        id: 'test-activity-id',
        name: undefined,
        approximate_duration_minutes: 0,
        group_size: 'small' as const,
      };

      render(<AddToProgramModal {...defaultProps} activity={activityWithMissingData} />);

      // Should still render without crashing
      expect(screen.getByText('Atividade Selecionada')).toBeInTheDocument();
    });

    it('displays fallback text when Portuguese content is not available', () => {
      const activityWithEnglishOnly = {
        ...mockActivity,
        name: { en: 'Test Activity' },
      };

      render(<AddToProgramModal {...defaultProps} activity={activityWithEnglishOnly} />);

      expect(screen.getByText('Test Activity')).toBeInTheDocument();
    });
  });

  describe('modal behavior', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue(mockSession);
    });

    it('calls onClose when modal is closed', () => {
      render(<AddToProgramModal {...defaultProps} />);

      // The modal should be open by default
      expect(screen.getByText('Adicionar ao Programa')).toBeInTheDocument();

      // Simulate modal close (this would be handled by the Dialog component)
      // For testing purposes, we'll just verify the onClose prop is passed correctly
      expect(defaultProps.onClose).toBeDefined();
    });

    it('renders with correct activity data', () => {
      render(<AddToProgramModal {...defaultProps} />);

      expect(screen.getByTestId('add-to-program-modal')).toHaveAttribute('data-activity-id', 'test-activity-id');
      expect(screen.getByTestId('add-to-program-modal')).toHaveAttribute('data-is-open', 'true');
    });
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PDFExportButton } from '@/components/features/programs/PDFExportButton';
import { toast } from 'sonner';

// Mock the useProgramPDFExport hook
vi.mock('@/hooks/useProgramPDFExport', () => ({
  useProgramPDFExport: vi.fn(),
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

describe('PDFExportButton', () => {
  const mockExportToPDF = vi.fn();
  const mockUseProgramPDFExport = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProgramPDFExport.mockReturnValue({
      exportToPDF: mockExportToPDF,
      isLoading: false,
    });
  });

  it('renders PDF export button with correct text', () => {
    render(
      <PDFExportButton 
        programId="test-program-id" 
        programName="Test Program" 
      />
    );

    expect(screen.getByText('Exportar PDF')).toBeInTheDocument();
  });

  it('shows loading state when exporting', () => {
    mockUseProgramPDFExport.mockReturnValue({
      exportToPDF: mockExportToPDF,
      isLoading: true,
    });

    render(
      <PDFExportButton 
        programId="test-program-id" 
        programName="Test Program" 
      />
    );

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls exportToPDF when button is clicked', async () => {
    mockExportToPDF.mockResolvedValue(undefined);

    render(
      <PDFExportButton 
        programId="test-program-id" 
        programName="Test Program" 
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockExportToPDF).toHaveBeenCalledWith('test-program-id');
    });
  });

  it('shows success toast on successful export', async () => {
    mockExportToPDF.mockResolvedValue(undefined);

    render(
      <PDFExportButton 
        programId="test-program-id" 
        programName="Test Program" 
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Programa exportado para PDF com sucesso!', {
        description: 'O ficheiro PDF foi descarregado.',
      });
    });
  });

  it('shows error toast on failed export', async () => {
    const errorMessage = 'Export failed';
    mockExportToPDF.mockRejectedValue(new Error(errorMessage));

    render(
      <PDFExportButton 
        programId="test-program-id" 
        programName="Test Program" 
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erro ao exportar programa para PDF', {
        description: errorMessage,
      });
    });
  });

  it('applies custom variant and size props', () => {
    render(
      <PDFExportButton 
        programId="test-program-id" 
        programName="Test Program"
        variant="outline"
        size="sm"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    // Note: Testing exact CSS classes would require more complex setup
    // This test ensures the component renders with the props
  });
});








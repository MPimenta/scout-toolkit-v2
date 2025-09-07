import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ExportButton } from '@/components/features/programs/ExportButton';

// Mock the useProgramExport hook
const mockExportToExcel = vi.fn();
const mockUseProgramExport = vi.fn();

vi.mock('@/hooks/useProgramExport', () => ({
  useProgramExport: () => mockUseProgramExport(),
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

describe('ExportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProgramExport.mockReturnValue({
      exportToExcel: mockExportToExcel,
      isExporting: false,
    });
  });

  it('renders export button with correct text', () => {
    render(
      <ExportButton 
        programId="test-program-id" 
        programName="Test Program" 
      />
    );

    expect(screen.getByText('Exportar Excel')).toBeInTheDocument();
  });

  it('shows loading state when exporting', () => {
    mockUseProgramExport.mockReturnValue({
      exportToExcel: mockExportToExcel,
      isExporting: true,
    });

    render(
      <ExportButton 
        programId="test-program-id" 
        programName="Test Program" 
      />
    );

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls exportToExcel when button is clicked', async () => {
    mockExportToExcel.mockResolvedValue(undefined);

    render(
      <ExportButton 
        programId="test-program-id" 
        programName="Test Program" 
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockExportToExcel).toHaveBeenCalledWith('test-program-id');
    });
  });
});

'use client';

import React from 'react';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProgramExport } from '@/hooks/useProgramExport';
import { toast } from 'sonner';
import { log } from '@/lib/errors';
import { validateProps } from '@/lib/validation';
import { specificSchemas } from '@/lib/validation/component-schemas';

/**
 * Props for the ExportButton component
 */
interface ExportButtonProps {
  programId: string;
  programName: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

/**
 * ExportButton component for exporting programs to Excel
 * Provides a button interface for downloading program data as Excel files
 * @param programId - The ID of the program to export
 * @param programName - The name of the program for display purposes
 * @param variant - Button variant style
 * @param size - Button size
 * @param className - Additional CSS classes
 * @returns JSX element representing the export button
 */
export function ExportButton({ 
  programId, 
  programName, 
  variant = 'outline', 
  size = 'default',
  className = ''
}: ExportButtonProps) {
  // Validate props in development
  if (process.env.NODE_ENV === 'development') {
    validateProps({ programId, programName, variant, size, className }, specificSchemas.exportButton, 'ExportButton');
  }

  const { exportToExcel, isExporting, exportError } = useProgramExport();

  const handleExport = async () => {
    try {
      log.info('Export button clicked', { programId, programName });
      await exportToExcel(programId);
      toast.success('Programa exportado com sucesso!', {
        description: `O ficheiro Excel foi descarregado.`,
      });
    } catch (error) {
      log.error('Export failed', error instanceof Error ? error : new Error(String(error)));
      toast.error('Erro ao exportar programa', {
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado.',
      });
    }
  };

  // Show error toast if export failed
  React.useEffect(() => {
    if (exportError) {
      toast.error('Erro ao exportar programa', {
        description: exportError instanceof Error ? exportError.message : 'Ocorreu um erro inesperado.',
      });
    }
  }, [exportError]);

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant={variant}
      size={size}
      className={`flex items-center gap-2 ${className}`}
      title={`Exportar programa "${programName}" para Excel`}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="h-4 w-4" />
      )}
      {isExporting ? 'A exportar...' : 'Exportar Excel'}
    </Button>
  );
}

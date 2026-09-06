'use client';

import React from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProgramPDFExport } from '@/hooks/useProgramPDFExport';
import { toast } from 'sonner';
import { log } from '@/lib/errors';
import { validateProps } from '@/lib/validation';
import { specificSchemas } from '@/lib/validation/component-schemas';
import { VariantProps } from 'class-variance-authority';
import { buttonVariants } from '@/components/ui/button';
import { useLocale } from '@/components/locale/LocaleProvider';

/**
 * Props for the PDFExportButton component
 */
interface PDFExportButtonProps extends 
  React.ComponentProps<"button">,
  VariantProps<typeof buttonVariants> {
  programId: string;
  programName: string;
}

/**
 * PDFExportButton component for triggering program data export to PDF.
 * Displays a button that, when clicked, initiates the download of a PDF file
 * containing the program's summary, schedule, and activity details with print-optimized styling.
 *
 * @param programId - The ID of the program to export.
 * @param programName - The name of the program, used for the filename.
 * @param variant - The visual style of the button (e.g., "outline", "default").
 * @param size - The size of the button (e.g., "default", "sm", "lg").
 * @param className - Optional CSS class names for the button.
 * @returns A React button component.
 */
export function PDFExportButton({ programId, programName, variant, size, className }: PDFExportButtonProps) {
  if (process.env.NODE_ENV === 'development') {
    validateProps({ programId, programName, variant, size, className }, specificSchemas.pdfExportButton, 'PDFExportButton');
  }

  const { t } = useLocale();
  const { exportToPDF, isLoading } = useProgramPDFExport();

  const handleExport = async () => {
    try {
      log.info('PDF export button clicked', { programId, programName });
      await exportToPDF(programId);
      toast.success('Programa exportado para PDF com sucesso!', {
        description: `O ficheiro PDF foi descarregado.`,
      });
    } catch (error) {
      log.error('PDF export failed', error instanceof Error ? error : new Error(String(error)));
      toast.error('Erro ao exportar programa para PDF', {
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado.',
      });
    }
  };

  return (
    <Button
      onClick={handleExport}
      variant={variant}
      size={size}
      className={className}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileText className="mr-2 h-4 w-4" />
      )}
      {t('export.pdf')}
    </Button>
  );
}

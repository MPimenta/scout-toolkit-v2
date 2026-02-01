'use client';

import { useState } from 'react';
import { log } from '@/lib/errors';

/**
 * Custom hook for exporting program data to PDF.
 * Provides a function to trigger the export and manages loading state.
 * @returns An object containing the export function and loading state.
 */
export function useProgramPDFExport() {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Initiates the PDF export process for a given program.
   * @param programId - The ID of the program to export.
   * @throws Error if the export fails.
   */
  const exportToPDF = async (programId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/programs/${programId}/export/pdf`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/pdf',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        log.error('API PDF export error', errorData);
        throw new Error(errorData.error?.message || 'Failed to export program to PDF');
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `programa_export_${new Date().toISOString().split('T')[0]}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      log.info('Program PDF exported successfully', { programId, filename });
    } catch (error) {
      log.error('Error during PDF export', error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { exportToPDF, isLoading };
}

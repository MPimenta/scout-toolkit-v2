import { useMutation } from '@tanstack/react-query';
import { log } from '@/lib/errors';

/**
 * Hook for program export functionality
 * Provides Excel export capabilities for programs
 */
export function useProgramExport() {
  const exportToExcel = useMutation({
    mutationFn: async (programId: string) => {
      log.info('Starting Excel export for program', { programId });
      
      const response = await fetch(`/api/programs/${programId}/export/excel`, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Export failed with status ${response.status}`);
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
        : `program_export_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Convert response to blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      log.info('Excel export completed successfully', { programId, filename });
      return { success: true, filename };
    },
    onError: (error) => {
      log.error('Excel export failed', error);
    },
  });

  return {
    exportToExcel: exportToExcel.mutate,
    isExporting: exportToExcel.isPending,
    exportError: exportToExcel.error,
  };
}

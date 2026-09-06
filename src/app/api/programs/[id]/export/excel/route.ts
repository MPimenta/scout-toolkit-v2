import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { buildProgramExcelWorkbook } from '@/lib/export/excel';
import { canAccessProgramExport } from '@/lib/export/access';
import { loadProgramForExport } from '@/lib/export/load-program';
import {
  apiErrors,
  logApiRequest,
  logApiResponse,
  withApiErrorHandler,
} from '@/lib/errors';
import { validateUUID } from '@/lib/errors/error-handler';

/**
 * Excel export endpoint for programs
 * Exports program data to Excel format with multiple Portuguese sheets
 */
export const GET = withApiErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  logApiRequest('GET', '/api/programs/[id]/export/excel');

  const session = await auth();
  if (!session?.user?.id) {
    return apiErrors.unauthorized();
  }

  const { id: programId } = await params;

  const uuidValidation = validateUUID(programId);
  if (!uuidValidation.success) {
    return apiErrors.validation('id', 'ID do programa inválido');
  }

  const program = await loadProgramForExport(programId);
  if (!program) {
    return apiErrors.notFound('Programa não encontrado');
  }

  if (!canAccessProgramExport(program, session.user.id)) {
    return apiErrors.forbidden('Acesso negado a este programa');
  }

  const { buffer, filename } = buildProgramExcelWorkbook(program);

  const response = new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    },
  });

  logApiResponse('GET', '/api/programs/[id]/export/excel', 200, { filename });
  return response;
});

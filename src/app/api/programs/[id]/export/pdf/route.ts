import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { chromium } from 'playwright';
import { generateProgramPDFHTML } from '@/lib/export/pdf-html';
import { canAccessProgramExport } from '@/lib/export/access';
import { loadProgramForExport } from '@/lib/export/load-program';
import { buildExportFilename } from '@/lib/export/labels';
import {
  apiErrors,
  logApiRequest,
  logApiResponse,
  withApiErrorHandler,
} from '@/lib/errors';
import { validateUUID } from '@/lib/errors/error-handler';

/**
 * PDF export endpoint for programs
 * Renders print-optimized HTML to PDF with Playwright Chromium
 */
export const GET = withApiErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  logApiRequest('GET', '/api/programs/[id]/export/pdf');

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

  try {
    const browser = await launchPdfBrowser();
    const page = await browser.newPage();
    const htmlContent = generateProgramPDFHTML(program);

    await page.setContent(htmlContent, { waitUntil: 'networkidle' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    await browser.close();

    const filename = buildExportFilename(program.name, 'pdf');

    const response = new NextResponse(pdfBuffer as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

    logApiResponse('GET', '/api/programs/[id]/export/pdf', 200, { filename });
    return response;
  } catch (error) {
    logApiResponse('GET', '/api/programs/[id]/export/pdf', 500, {
      error: error instanceof Error ? error.message : String(error),
    });
    return apiErrors.internal('Erro ao gerar PDF');
  }
});

/**
 * Launches Chromium for PDF rendering. Uses Playwright's bundled browser,
 * then falls back to an installed Chrome or Edge if browsers were not downloaded.
 */
async function launchPdfBrowser() {
  try {
    return await chromium.launch();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("Executable doesn't exist")) {
      throw error;
    }

    for (const channel of ['chrome', 'msedge'] as const) {
      try {
        return await chromium.launch({ channel });
      } catch {
        // try next channel
      }
    }

    throw error;
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/server';
import { programs, programEntries, activities, activityTypes, user } from '../../../../../../../drizzle/schema';
import { eq, asc } from 'drizzle-orm';
import { chromium } from 'playwright';
import {
  apiErrors,
  logApiRequest,
  logApiResponse,
  withApiErrorHandler
} from '@/lib/errors';
import { validateUUID } from '@/lib/errors/error-handler';

/**
 * PDF export endpoint for programs
 * Exports program data to PDF format with print-optimized styling
 * @param request - The Next.js request object
 * @param params - Route parameters containing program ID
 * @returns PDF file download response
 */
export const GET = withApiErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  logApiRequest('GET', '/api/programs/[id]/export/pdf');

  // Check authentication
  const session = await auth();
  if (!session?.user?.id) {
    return apiErrors.unauthorized();
  }

  const { id: programId } = await params;

  // Validate program ID
  const uuidValidation = validateUUID(programId);
  if (!uuidValidation.success) {
    return apiErrors.validation('id', 'ID do programa inválido');
  }

  // Fetch program with user info
  const [programData] = await db
    .select({
      id: programs.id,
      name: programs.name,
      date: programs.date,
      start_time: programs.start_time,
      is_public: programs.is_public,
      user_id: programs.user_id,
      created_at: programs.created_at,
      updated_at: programs.updated_at,
      user_name: user.name,
    })
    .from(programs)
    .leftJoin(user, eq(programs.user_id, user.id))
    .where(eq(programs.id, programId));

  if (!programData) {
    return apiErrors.notFound('Programa não encontrado');
  }

  // Check if user owns the program or if it's public
  if (programData.user_id !== session.user.id && !programData.is_public) {
    return apiErrors.forbidden('Acesso negado a este programa');
  }

  // Fetch program entries with activity data
  const entries = await db
    .select({
      id: programEntries.id,
      position: programEntries.position,
      start_time: programEntries.start_time,
      end_time: programEntries.end_time,
      entry_type: programEntries.entry_type,
      custom_title: programEntries.custom_title,
      custom_duration_minutes: programEntries.custom_duration_minutes,
      activity_id: activities.id,
      activity_name: activities.name,
      activity_description: activities.description,
      activity_materials: activities.materials,
      activity_duration: activities.approximate_duration_minutes,
      activity_group_size: activities.group_size,
      activity_effort_level: activities.effort_level,
      activity_location: activities.location,
      activity_type_name: activityTypes.name,
    })
    .from(programEntries)
    .leftJoin(activities, eq(programEntries.activity_id, activities.id))
    .leftJoin(activityTypes, eq(activities.activity_type_id, activityTypes.id))
    .where(eq(programEntries.program_id, programId))
    .orderBy(asc(programEntries.position));

  // Create program object for PDF generation
  const program = {
    ...programData,
    user: { name: programData.user_name },
    entries: entries.map(entry => ({
      id: entry.id,
      position: entry.position,
      start_time: entry.start_time,
      end_time: entry.end_time,
      entry_type: entry.entry_type,
      custom_title: entry.custom_title,
      custom_duration_minutes: entry.custom_duration_minutes,
      activity: entry.activity_id ? {
        id: entry.activity_id,
        name: entry.activity_name,
        description: entry.activity_description,
        materials: entry.activity_materials,
        approximate_duration_minutes: entry.activity_duration,
        group_size: entry.activity_group_size,
        effort_level: entry.activity_effort_level,
        location: entry.activity_location,
        activityType: { name: entry.activity_type_name },
      } : null,
    })),
  };

  try {
    // Launch browser
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Generate HTML content for PDF
    const htmlContent = generatePDFHTML(program);

    // Set content and wait for any resources to load
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });

    // Generate PDF
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

    // Set response headers for file download
    const filename = `programa_${program.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

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
    logApiResponse('GET', '/api/programs/[id]/export/pdf', 500, { error: error instanceof Error ? error.message : String(error) });
    return apiErrors.internal('Erro ao gerar PDF');
  }
});

/**
 * Program data type for PDF generation
 */
type ProgramForPDF = {
  id: string;
  name: string;
  date?: string | null;
  start_time: string;
  is_public: boolean;
  user?: { name?: string | null } | null;
  entries: Array<{
    id: string;
    position: number;
    start_time: string;
    end_time: string;
    entry_type: string;
    custom_title?: string | null;
    custom_duration_minutes?: number | null;
    activity?: {
      id: string;
      name?: string | null;
      description?: string | null;
      materials?: string | null;
      approximate_duration_minutes?: number | null;
      group_size?: string | null;
      effort_level?: string | null;
      location?: string | null;
      activityType?: { name?: string | null };
    } | null;
  }>;
};

/**
 * Generates HTML content for PDF export
 * @param program - The program data to include in PDF
 * @returns HTML string optimized for PDF generation
 */
function generatePDFHTML(program: ProgramForPDF): string {
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Não especificada';
    try {
      return new Date(dateString).toLocaleDateString('pt-PT');
    } catch {
      return 'Data inválida';
    }
  };

  const formatTime = (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(':');
      return `${hours}:${minutes}`;
    } catch {
      return timeString;
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}min` : ''}`.trim();
    }
    return `${mins}min`;
  };

  const totalDuration = program.entries.reduce((total: number, entry) => {
    const start = new Date(`2000-01-01T${entry.start_time}`);
    const end = new Date(`2000-01-01T${entry.end_time}`);
    return total + (end.getTime() - start.getTime()) / (1000 * 60);
  }, 0);

  return `
    <!DOCTYPE html>
    <html lang="pt-PT">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Programa: ${program.name}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
          background: white;
        }

        .container {
          max-width: 100%;
          margin: 0 auto;
          padding: 0;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
        }

        .header h1 {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .header .subtitle {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }

        .info-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
        }

        .info-card .label {
          font-size: 10px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .info-card .value {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .schedule-section {
          margin-bottom: 30px;
        }

        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 15px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 8px;
        }

        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }

        .schedule-table th,
        .schedule-table td {
          border: 1px solid #e5e7eb;
          padding: 8px;
          text-align: left;
          vertical-align: top;
        }

        .schedule-table th {
          background: #f3f4f6;
          font-weight: 600;
          color: #374151;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .schedule-table td {
          font-size: 11px;
        }

        .entry-type {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .entry-type.activity {
          background: #dbeafe;
          color: #1e40af;
        }

        .entry-type.custom {
          background: #fef3c7;
          color: #92400e;
        }

        .activity-details {
          margin-top: 4px;
          font-size: 10px;
          color: #6b7280;
        }

        .summary-section {
          margin-top: 30px;
          page-break-inside: avoid;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 15px;
        }

        .summary-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
        }

        .summary-card h4 {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .badge {
          display: inline-block;
          background: #f3f4f6;
          color: #374151;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9px;
          margin: 1px 2px 1px 0;
          border: 1px solid #e5e7eb;
        }

        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 10px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
          padding-top: 15px;
        }

        @media print {
          body {
            font-size: 11px;
          }
          
          .info-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .summary-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>${program.name}</h1>
          <div class="subtitle">Criado por ${program.user?.name || 'Utilizador desconhecido'}</div>
          <div class="subtitle">Gerado em ${new Date().toLocaleDateString('pt-PT')}</div>
        </div>

        <!-- Program Info -->
        <div class="info-grid">
          <div class="info-card">
            <div class="label">Data</div>
            <div class="value">${formatDate(program.date)}</div>
          </div>
          <div class="info-card">
            <div class="label">Hora de Início</div>
            <div class="value">${formatTime(program.start_time)}</div>
          </div>
          <div class="info-card">
            <div class="label">Entradas</div>
            <div class="value">${program.entries.length}</div>
          </div>
          <div class="info-card">
            <div class="label">Duração Total</div>
            <div class="value">${formatDuration(totalDuration)}</div>
          </div>
        </div>

        <!-- Schedule Section -->
        <div class="schedule-section">
          <h2 class="section-title">Cronograma do Programa</h2>
          <table class="schedule-table">
            <thead>
              <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 15%;">Horário</th>
                <th style="width: 35%;">Atividade/Bloco</th>
                <th style="width: 15%;">Tipo</th>
                <th style="width: 15%;">Duração</th>
                <th style="width: 15%;">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              ${program.entries.map((entry) => `
                <tr>
                  <td>${entry.position}</td>
                  <td>${formatTime(entry.start_time)} - ${formatTime(entry.end_time)}</td>
                  <td>
                    <strong>${entry.entry_type === 'activity' && entry.activity ? entry.activity.name : entry.custom_title || 'Bloco Personalizado'}</strong>
                    ${entry.entry_type === 'activity' && entry.activity?.description ? `
                      <div class="activity-details">${entry.activity.description}</div>
                    ` : ''}
                  </td>
                  <td>
                    <span class="entry-type ${entry.entry_type}">
                      ${entry.entry_type === 'activity' ? 'Atividade' : 'Personalizado'}
                    </span>
                  </td>
                  <td>
                    ${entry.entry_type === 'activity' && entry.activity 
                      ? formatDuration(entry.activity.approximate_duration_minutes || 0)
                      : formatDuration(entry.custom_duration_minutes || 0)
                    }
                  </td>
                  <td>
                    ${entry.entry_type === 'activity' && entry.activity ? `
                      <div class="activity-details">
                        ${entry.activity.group_size ? `Grupo: ${entry.activity.group_size}<br>` : ''}
                        ${entry.activity.effort_level ? `Esforço: ${entry.activity.effort_level}<br>` : ''}
                        ${entry.activity.location ? `Local: ${entry.activity.location}` : ''}
                      </div>
                    ` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Summary Section -->
        <div class="summary-section">
          <h2 class="section-title">Resumo do Programa</h2>
          <div class="summary-grid">
            <div class="summary-card">
              <h4>Informações Gerais</h4>
              <p><strong>Nome:</strong> ${program.name}</p>
              <p><strong>Data:</strong> ${formatDate(program.date)}</p>
              <p><strong>Hora de Início:</strong> ${formatTime(program.start_time)}</p>
              <p><strong>Total de Entradas:</strong> ${program.entries.length}</p>
              <p><strong>Duração Total:</strong> ${formatDuration(totalDuration)}</p>
              <p><strong>Criado por:</strong> ${program.user?.name || 'Utilizador desconhecido'}</p>
            </div>
            <div class="summary-card">
              <h4>Tipos de Atividades</h4>
              <p><strong>Atividades:</strong>               ${program.entries.filter((e) => e.entry_type === 'activity').length}</p>
              <p><strong>Blocos Personalizados:</strong> ${program.entries.filter((e) => e.entry_type === 'custom').length}</p>
              ${program.entries.some((e) => e.activity?.materials) ? `
                <p><strong>Materiais Necessários:</strong></p>
                <div style="margin-top: 5px;">
                  ${program.entries
                    .filter((e) => e.activity?.materials)
                    .map((e) => `<div class="badge">${e.activity?.materials}</div>`)
                    .join('')}
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>Este documento foi gerado automaticamente pelo Scout Activities Platform</p>
          <p>Escoteiros de Portugal - ${new Date().getFullYear()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

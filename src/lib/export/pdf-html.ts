import type { ProgramForExport } from './types';
import {
  exportLabels,
  formatExportDate,
  formatGoalLabel,
  formatSdgLabel,
  translateEffortLevel,
  translateGroupSize,
  translateLocation,
} from './labels';
import { getUniqueEducationalGoals, getUniqueSdgs } from './excel';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  if (!hours || !minutes) return timeString;
  return `${hours}:${minutes}`;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${mins > 0 ? `${mins}min` : ''}`.trim();
  }
  return `${mins}min`;
}

/**
 * Generates print-optimized HTML for a program PDF (summary + schedule).
 */
export function generateProgramPDFHTML(program: ProgramForExport): string {
  const uniqueGoals = getUniqueEducationalGoals(program.entries);
  const uniqueSdgs = getUniqueSdgs(program.entries);

  const totalDuration = program.entries.reduce((total, entry) => {
    const start = new Date(`2000-01-01T${entry.start_time}`);
    const end = new Date(`2000-01-01T${entry.end_time}`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return total;
    }
    return total + (end.getTime() - start.getTime()) / (1000 * 60);
  }, 0);

  const creatorName = escapeHtml(program.user?.name || 'Utilizador desconhecido');
  const programName = escapeHtml(program.name);

  return `
    <!DOCTYPE html>
    <html lang="pt-PT">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Programa: ${programName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
          background: white;
        }
        .container { max-width: 100%; margin: 0 auto; padding: 0; }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
        }
        .header h1 { font-size: 24px; font-weight: bold; color: #1f2937; margin-bottom: 8px; }
        .header .subtitle { font-size: 14px; color: #6b7280; margin-bottom: 4px; }
        .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
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
        .info-card .value { font-size: 14px; font-weight: 600; color: #1f2937; }
        .schedule-section { margin-bottom: 30px; }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 15px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 8px;
        }
        .schedule-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .schedule-table th, .schedule-table td {
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
        .schedule-table td { font-size: 11px; }
        .entry-type {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 500;
          text-transform: uppercase;
        }
        .entry-type.activity { background: #dbeafe; color: #1e40af; }
        .entry-type.custom { background: #fef3c7; color: #92400e; }
        .activity-details { margin-top: 4px; font-size: 10px; color: #6b7280; }
        .summary-section { margin-top: 30px; page-break-inside: avoid; }
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; }
        .summary-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
        }
        .summary-card h4 { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 8px; }
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
          body { font-size: 11px; }
          .info-grid { grid-template-columns: repeat(2, 1fr); }
          .summary-grid { grid-template-columns: 1fr; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${programName}</h1>
          <div class="subtitle">Criado por ${creatorName}</div>
          <div class="subtitle">Gerado em ${escapeHtml(new Date().toLocaleDateString('pt-PT'))}</div>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <div class="label">${exportLabels.date}</div>
            <div class="value">${escapeHtml(formatExportDate(program.date))}</div>
          </div>
          <div class="info-card">
            <div class="label">${exportLabels.startTime}</div>
            <div class="value">${escapeHtml(formatTime(program.start_time))}</div>
          </div>
          <div class="info-card">
            <div class="label">Entradas</div>
            <div class="value">${program.entries.length}</div>
          </div>
          <div class="info-card">
            <div class="label">${exportLabels.totalDuration}</div>
            <div class="value">${formatDuration(totalDuration)}</div>
          </div>
        </div>

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
                  <td>${escapeHtml(formatTime(entry.start_time))} - ${escapeHtml(formatTime(entry.end_time))}</td>
                  <td>
                    <strong>${escapeHtml(
                      entry.entry_type === 'activity' && entry.activity
                        ? entry.activity.name || exportLabels.unknownActivity
                        : entry.custom_title || 'Bloco Personalizado'
                    )}</strong>
                    ${entry.entry_type === 'activity' && entry.activity?.description ? `
                      <div class="activity-details">${escapeHtml(entry.activity.description)}</div>
                    ` : ''}
                  </td>
                  <td>
                    <span class="entry-type ${entry.entry_type}">
                      ${entry.entry_type === 'activity' ? exportLabels.activity : 'Personalizado'}
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
                        ${entry.activity.group_size ? `Grupo: ${escapeHtml(translateGroupSize(entry.activity.group_size))}<br>` : ''}
                        ${entry.activity.effort_level ? `Esforço: ${escapeHtml(translateEffortLevel(entry.activity.effort_level))}<br>` : ''}
                        ${entry.activity.location ? `Local: ${escapeHtml(translateLocation(entry.activity.location))}` : ''}
                      </div>
                    ` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="summary-section">
          <h2 class="section-title">${exportLabels.programSummary}</h2>
          <div class="summary-grid">
            <div class="summary-card">
              <h4>Informações Gerais</h4>
              <p><strong>Nome:</strong> ${programName}</p>
              <p><strong>Data:</strong> ${escapeHtml(formatExportDate(program.date))}</p>
              <p><strong>Hora de Início:</strong> ${escapeHtml(formatTime(program.start_time))}</p>
              <p><strong>Total de Entradas:</strong> ${program.entries.length}</p>
              <p><strong>Duração Total:</strong> ${formatDuration(totalDuration)}</p>
              <p><strong>Criado por:</strong> ${creatorName}</p>
            </div>
            <div class="summary-card">
              <h4>Tipos de Atividades</h4>
              <p><strong>Atividades:</strong> ${program.entries.filter((e) => e.entry_type === 'activity').length}</p>
              <p><strong>Blocos Personalizados:</strong> ${program.entries.filter((e) => e.entry_type === 'custom').length}</p>
              ${program.entries.some((e) => e.activity?.materials) ? `
                <p><strong>Materiais Necessários:</strong></p>
                <div style="margin-top: 5px;">
                  ${program.entries
                    .filter((e) => e.activity?.materials)
                    .map((e) => `<div class="badge">${escapeHtml(e.activity?.materials || '')}</div>`)
                    .join('')}
                </div>
              ` : ''}
            </div>
            <div class="summary-card">
              <h4>${exportLabels.educationalGoals}</h4>
              ${uniqueGoals.length > 0
                ? uniqueGoals.map((goal) => `<div class="badge">${escapeHtml(formatGoalLabel(goal))}</div>`).join('')
                : `<p>${exportLabels.none}</p>`}
            </div>
            <div class="summary-card">
              <h4>${exportLabels.sdgs}</h4>
              ${uniqueSdgs.length > 0
                ? uniqueSdgs.map((sdg) => `<div class="badge">${escapeHtml(formatSdgLabel(sdg))}</div>`).join('')
                : `<p>${exportLabels.none}</p>`}
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Este documento foi gerado automaticamente pelo Scout Activities Platform</p>
          <p>Escoteiros de Portugal - ${new Date().getFullYear()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

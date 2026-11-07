import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { buildProgramExcelWorkbook } from '@/lib/export/excel';
import { generateProgramPDFHTML } from '@/lib/export/pdf-html';
import { exportLabels } from '@/lib/export/labels';
import type { ProgramForExport } from '@/lib/export/types';

const program: ProgramForExport = {
  id: 'p1',
  name: 'Sessão',
  date: '2026-04-12',
  start_time: '09:00:00',
  is_public: false,
  user_id: 'u1',
  created_at: '2026-04-01T10:00:00.000Z',
  updated_at: '2026-04-01T10:00:00.000Z',
  user: { name: 'Chefe Ana' },
  entries: [
    {
      id: 'e1',
      position: 1,
      start_time: '09:00:00',
      end_time: '09:30:00',
      entry_type: 'activity',
      custom_title: null,
      custom_duration_minutes: null,
      activity: {
        id: 'a1',
        name: 'Jogo da bandeira',
        description: 'Duas equipas',
        materials: 'Cones',
        instructions: 'Preparação\nMarcar o campo',
        approximate_duration_minutes: 30,
        group_sizes: ['medium'],
        effort_level: 'low',
        locations: ['outside'],
        activityTypes: [{ name: 'Jogo' }],
        educationalGoals: [],
        sdgs: [{ number: 3, name: 'Saúde', justification: 'Corpo ativo' }],
        physicalRisk: { level: 'medium', risk: 'Quedas', mitigation: 'Campo livre' },
        psychologicalRisk: { level: null, risk: null, mitigation: null },
        objectives: [{ code: '4E.1.1', title: 'Partilha', age_group: 'cub_scouts', behaviour: 'Partilha a vez' }],
        challenges: [{ code: 'EVAS-B', title: 'Participa em 3 jogos.' }],
        source: { name: 'Online Scout Manager', url: null, license: '© OYM' },
      },
    },
  ],
};

describe('export of the rich activity fields', () => {
  it('adds risks, objectives with behaviours, desafios and the source to the Excel details sheet', () => {
    const { buffer } = buildProgramExcelWorkbook(program);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const rows = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[exportLabels.detailsSheet]!, { header: 1 });
    const header = rows[0]!;
    const row = rows[1]!;
    const cell = (label: string) => String(row[header.indexOf(label)]);

    expect(cell(exportLabels.physicalRisk)).toContain('Médio: Quedas');
    expect(cell(exportLabels.physicalRisk)).toContain('Como reduzir: Campo livre');
    expect(cell(exportLabels.psychologicalRisk)).toBe('');
    expect(cell(exportLabels.objectivesByDivision)).toBe('cub_scouts 4E.1.1: Partilha a vez');
    expect(cell(exportLabels.challenges)).toBe('EVAS-B - Participa em 3 jogos.');
    expect(cell(exportLabels.source)).toBe('Online Scout Manager · © OYM');
  });

  it('puts safety before objectives in the PDF HTML', () => {
    const html = generateProgramPDFHTML(program);
    const risk = html.indexOf(exportLabels.physicalRisk);
    const objectives = html.indexOf(exportLabels.objectivesByDivision);
    expect(risk).toBeGreaterThan(-1);
    expect(objectives).toBeGreaterThan(risk);
    expect(html).toContain('Partilha a vez');
    expect(html).toContain('Online Scout Manager');
  });
});

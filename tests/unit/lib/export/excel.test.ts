import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { buildProgramExcelWorkbook, calculateTotalDuration } from '@/lib/export/excel';
import { exportLabels } from '@/lib/export/labels';
import { canAccessProgramExport } from '@/lib/export/access';
import type { ProgramForExport } from '@/lib/export/types';

const sampleProgram: ProgramForExport = {
  id: '550e8400-e29b-41d4-a716-446655440099',
  name: 'Acampamento de Primavera',
  date: '2026-04-12',
  start_time: '09:00:00',
  is_public: false,
  user_id: '550e8400-e29b-41d4-a716-446655440000',
  created_at: '2026-04-01T10:00:00.000Z',
  updated_at: '2026-04-01T10:00:00.000Z',
  user: { name: 'Chefe Ana' },
  entries: [
    {
      id: 'e1',
      position: 1,
      start_time: '09:00:00',
      end_time: '09:45:00',
      entry_type: 'activity',
      custom_title: null,
      custom_duration_minutes: null,
      activity: {
        id: 'a1',
        name: 'Jogo da Bandeira',
        description: 'Jogo de perseguição',
        materials: 'Bandeiras',
        approximate_duration_minutes: 45,
        group_size: 'medium',
        effort_level: 'high',
        location: 'outside',
        activityType: { name: 'Jogo' },
        educationalGoals: [{ code: 'F1', title: 'Cooperação' }],
        sdgs: [{ number: 4, name: 'Educação de qualidade' }],
      },
    },
    {
      id: 'e2',
      position: 2,
      start_time: '09:45:00',
      end_time: '10:00:00',
      entry_type: 'custom',
      custom_title: 'Lanche',
      custom_duration_minutes: 15,
      activity: null,
    },
  ],
};

function readWorkbook(buffer: Buffer) {
  return XLSX.read(buffer, { type: 'buffer' });
}

describe('buildProgramExcelWorkbook', () => {
  it('creates Portuguese sheets with summary, schedule, and activity details', () => {
    const { buffer, filename } = buildProgramExcelWorkbook(sampleProgram);
    const workbook = readWorkbook(buffer);

    expect(workbook.SheetNames).toEqual([
      exportLabels.summarySheet,
      exportLabels.scheduleSheet,
      exportLabels.detailsSheet,
    ]);
    expect(filename).toMatch(/^programa_Acampamento_de_Primavera_\d{4}-\d{2}-\d{2}\.xlsx$/);

    const summary = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[exportLabels.summarySheet], {
      header: 1,
    });
    expect(summary[0][0]).toBe('Resumo do Programa');
    expect(summary[1]).toEqual(['Nome do Programa', 'Acampamento de Primavera']);
    expect(summary.some((row) => row[1] === 'F1 Cooperação')).toBe(true);
    expect(summary.some((row) => String(row[1] || '').includes('ODS 4: Educação de qualidade'))).toBe(true);

    const schedule = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[exportLabels.scheduleSheet], {
      header: 1,
    });
    expect(schedule[0][3]).toBe('Tipo');
    expect(schedule[1][3]).toBe('Atividade');
    expect(schedule[1][4]).toBe('Jogo da Bandeira');
    expect(schedule[1][6]).toBe('Médio (7-15)');
    expect(schedule[1][10]).toBe('F1 Cooperação');
    expect(schedule[1][11]).toBe('ODS 4: Educação de qualidade');
    expect(schedule[2][3]).toBe('Bloco personalizado');
    expect(schedule[2][4]).toBe('Lanche');

    const details = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[exportLabels.detailsSheet], {
      header: 1,
    });
    expect(details[1][0]).toBe('Jogo da Bandeira');
    expect(details[1][7]).toBe('F1 Cooperação');
    expect(details[1][8]).toBe('ODS 4: Educação de qualidade');
  });

  it('omits the activity details sheet when there are no activities', () => {
    const customOnly: ProgramForExport = {
      ...sampleProgram,
      entries: [sampleProgram.entries[1]],
    };

    const { buffer } = buildProgramExcelWorkbook(customOnly);
    const workbook = readWorkbook(buffer);

    expect(workbook.SheetNames).toEqual([exportLabels.summarySheet, exportLabels.scheduleSheet]);
  });

  it('shows a placeholder when goals and SDGs are missing', () => {
    const withoutTaxonomy: ProgramForExport = {
      ...sampleProgram,
      entries: [
        {
          ...sampleProgram.entries[0],
          activity: {
            ...sampleProgram.entries[0].activity!,
            educationalGoals: [],
            sdgs: [],
          },
        },
      ],
    };

    const { buffer } = buildProgramExcelWorkbook(withoutTaxonomy);
    const workbook = readWorkbook(buffer);
    const summary = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[exportLabels.summarySheet], {
      header: 1,
    });

    expect(summary.some((row) => row[0] === 'Objetivos Educativos')).toBe(true);
    expect(summary.some((row) => row[1] === '—')).toBe(true);
  });
});

describe('calculateTotalDuration', () => {
  it('sums activity and custom block minutes', () => {
    expect(calculateTotalDuration(sampleProgram.entries)).toBe('1h 0min');
  });
});

describe('canAccessProgramExport', () => {
  it('allows the owner or a public program', () => {
    expect(canAccessProgramExport(sampleProgram, sampleProgram.user_id)).toBe(true);
    expect(canAccessProgramExport({ ...sampleProgram, is_public: true }, 'other-user')).toBe(true);
    expect(canAccessProgramExport(sampleProgram, 'other-user')).toBe(false);
  });
});

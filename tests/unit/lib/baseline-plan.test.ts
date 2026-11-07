import { describe, expect, it } from 'vitest';
import { planBaselineLoad, summarizeReport, type SheetRow } from '@/lib/activities/baseline-plan';

const HEADERS = ['atividade_id', 'Nome', 'Descrição', 'Materiais', 'Intruções?', 'Mins', 'Grupo', 'Esforço', 'Local', 'Tipo', 'Divisão', 'ODS', 'Fonte'];
const taxonomies = {
  types: [
    { id: 'type-jogo', name: 'Jogo' },
    { id: 'type-arte', name: 'Artesanato' },
  ],
  sdgs: [{ id: 'sdg-4', number: 4, name: 'Educação de Qualidade' }],
};

const row = (overrides: Partial<Record<(typeof HEADERS)[number], string>> = {}): SheetRow => ({
  atividade_id: 'ATV-1',
  Nome: 'Jogo da Bandeira',
  Descrição: 'Duas equipas disputam bandeiras.',
  Materiais: 'Bandeiras',
  'Intruções?': '1. Dividir\n2. Jogar',
  Mins: '15-30',
  Grupo: 'Médio (7-15)',
  Esforço: 'Alto',
  Local: 'Exterior',
  Tipo: 'Jogo',
  Divisão: 'Escoteiros',
  ODS: '4',
  Fonte: 'Manual A',
  ...overrides,
});

const plan = (rows: SheetRow[], limit = 200, existing: Array<{ name: string; age_groups: string[] }> = []) =>
  planBaselineLoad(HEADERS, rows, taxonomies, { limit, seed: 1, existing });

describe('planBaselineLoad', () => {
  it('normalises a row into an activity with lists', () => {
    const { selected, report } = plan([row({ Divisão: 'Lobitos, Escoteiros', Local: 'Interior, Exterior', Tipo: 'Jogo, Artesanato' })]);
    expect(selected).toHaveLength(1);
    expect(selected[0]!.data).toMatchObject({
      name: 'Jogo da Bandeira',
      approximate_duration_minutes: 30,
      group_sizes: ['medium'],
      effort_level: 'high',
      locations: ['inside', 'outside'],
      age_groups: ['cub_scouts', 'scouts'],
      activity_type_ids: ['type-jogo', 'type-arte'],
      sdg_ids: ['sdg-4'],
      instructions: '1. Dividir\n2. Jogar',
      sdgs: [{ sdg_id: 'sdg-4', justification: null }],
    });
    expect(report.collapsedDurations).toEqual([{ row: 1, note: expect.stringContaining('30') }]);
  });

  it('turns "-" materials into the none-needed text and "-" instructions into null', () => {
    const { selected } = plan([row({ Materiais: '-', 'Intruções?': '-' })]);
    expect(selected[0]!.data.materials).toBe('Nenhum material necessário');
    expect(selected[0]!.data.instructions).toBeNull();
  });

  it('skips rows with missing mandatory data and says why', () => {
    const { selected, report } = plan([
      row({ Nome: 'Sem Grupo', Grupo: '' }),
      row({ Nome: 'Sem Esforço', Esforço: '' }),
      row({ Nome: 'Sem Duração', Mins: '' }),
      row({ Nome: 'Tipo Desconhecido', Tipo: 'Culinária' }),
      row({ Nome: 'Secção Desconhecida', Divisão: 'Marcianos' }),
      row({ Nome: 'Boa' }),
    ]);
    expect(selected.map((s) => s.data.name)).toEqual(['Boa']);
    expect(report.skipped.map((s) => s.reason)).toEqual([
      'grupo em falta ou não reconhecido',
      'esforço em falta ou não reconhecido',
      'duração em falta',
      'tipo em falta ou não reconhecido',
      'divisão em falta ou não reconhecida',
    ]);
    expect(report.unmapped.types).toEqual({ Culinária: 1 });
  });

  it('ignores blank spacer rows and flags the example row', () => {
    const blank: SheetRow = Object.fromEntries(HEADERS.map((h) => [h, '']));
    const { report, selected } = plan([blank, row({ Nome: 'Jogo da bandeira (exemplo)' }), row()]);
    expect(report.rowsRead).toBe(2);
    expect(report.skipped).toEqual([expect.objectContaining({ reason: 'linha de exemplo' })]);
    expect(selected).toHaveLength(1);
  });

  it('reports values it dropped but keeps the rest', () => {
    const { selected, report } = plan([row({ Divisão: 'Escoteiros, Marcianos', ODS: '4, Paz' })]);
    expect(selected[0]!.data.age_groups).toEqual(['scouts']);
    expect(report.droppedValues).toEqual([expect.objectContaining({ field: 'divisão', values: ['Marcianos'] })]);
    expect(report.unmapped.sdgs).toEqual({ Paz: 1 });
  });

  it('skips duplicates that share a name and an age group, in the file and in the catalogue', () => {
    const { selected, report } = plan(
      [
        row({ Nome: 'Jogo  da   BANDEIRA', Divisão: 'Escoteiros, Lobitos' }),
        row({ Nome: 'jogo da bandeira', Divisão: 'Lobitos' }),
        row({ Nome: 'Jogo da Bandeira', Divisão: 'Caminheiros' }),
        row({ Nome: 'Já Existe', Divisão: 'Escoteiros' }),
      ],
      200,
      [{ name: 'já existe', age_groups: ['scouts'] }]
    );
    expect(selected.map((s) => s.row)).toEqual([1, 3]);
    expect(report.skipped.map((s) => s.reason)).toEqual([
      'duplicada (mesmo nome e secção)',
      'duplicada (mesmo nome e secção)',
    ]);
  });

  it('selects deterministically, balanced across source and age group', () => {
    const rows = [
      ...Array.from({ length: 6 }, (_, i) => row({ Nome: `A${i}`, Fonte: 'A', Divisão: 'Lobitos' })),
      ...Array.from({ length: 6 }, (_, i) => row({ Nome: `B${i}`, Fonte: 'B', Divisão: 'Caminheiros' })),
    ];
    const first = plan(rows, 4);
    const second = plan(rows, 4);
    expect(first.selected.map((s) => s.data.name)).toEqual(second.selected.map((s) => s.data.name));
    const sources = first.selected.map((s) => s.source);
    expect(sources.filter((s) => s === 'A')).toHaveLength(2);
    expect(sources.filter((s) => s === 'B')).toHaveLength(2);
    expect(first.report.selected).toBe(4);
  });

  it('fails fast and lists the required columns that are missing', () => {
    const result = planBaselineLoad(['Nome'], [{ Nome: 'x' }], taxonomies, { limit: 10, seed: 1 });
    expect(result.missingColumns?.length).toBeGreaterThan(3);
    expect(result.selected).toEqual([]);
  });

  it('computes fill rates and a readable summary', () => {
    const { report } = plan([row(), row({ Nome: 'Outra', 'Intruções?': '-' })]);
    expect(report.fillRates['instructions']).toEqual({ filled: 1, total: 2 });
    expect(summarizeReport(report, 2)).toContain('Carregadas: 2');
  });
});

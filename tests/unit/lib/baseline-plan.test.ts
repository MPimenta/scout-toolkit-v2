import { describe, expect, it } from 'vitest';
import { planBaselineLoad, summarizeReport, type SheetRow } from '@/lib/activities/baseline-plan';

const HEADERS = ['atividade_id', 'Nome', 'Descrição', 'Materiais', 'Intruções?', 'Mins', 'Grupo', 'Esforço', 'Local', 'Tipo', 'Divisão', 'ODS', 'Fonte', 'Formato', 'Foco', 'Foco secundário', 'duracao_min', 'duracao_max', 'Publicada', 'estado', 'confianca', 'variantes'];
const taxonomies = {
  types: [
    { id: 'type-jogo', name: 'Jogo' },
    { id: 'type-arte', name: 'Artesanato' },
  ],
  formats: [
    { id: 'fmt-jogo', name: 'Jogo', code: 'jogo' },
    { id: 'fmt-quebra', name: 'Quebra-gelo', code: 'quebra-gelo' },
  ],
  focuses: [
    { id: 'foc-coop', name: 'Cooperação', code: 'cooperacao' },
    { id: 'foc-lider', name: 'Liderança', code: 'lideranca' },
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
  Formato: 'Jogo',
  Foco: 'Cooperação',
  'Foco secundário': 'Liderança',
  duracao_min: '15',
  duracao_max: '30',
  Publicada: 'FALSE',
  estado: 'revisto_por_claude',
  confianca: 'alta',
  variantes: '',
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
      row({ Nome: 'Formato Desconhecido', Formato: 'Culinária' }),
      row({ Nome: 'Sem Foco', Foco: '' }),
      row({ Nome: 'Secção Desconhecida', Divisão: 'Marcianos' }),
      row({ Nome: 'Boa' }),
    ]);
    expect(selected.map((s) => s.data.name)).toEqual(['Boa']);
    expect(report.skipped.map((s) => s.reason)).toEqual([
      'grupo em falta ou não reconhecido',
      'esforço em falta ou não reconhecido',
      'duração em falta',
      'formato em falta ou não reconhecido',
      'foco em falta ou não reconhecido',
      'divisão em falta ou não reconhecida',
    ]);
    expect(report.droppedValues).toContainEqual(expect.objectContaining({ field: 'formato', values: ['Culinária'] }));
  });

  it('no longer needs the former activity type', () => {
    const { selected, report } = plan([row({ Tipo: 'Culinária' })]);
    expect(selected).toHaveLength(1);
    expect(selected[0]!.data.activity_type_ids).toEqual([]);
    expect(report.unmapped.types).toEqual({ Culinária: 1 });
  });

  it('maps format, main focus and secondary focus, never creating values', () => {
    const { selected } = plan([row({ Formato: 'Quebra-gelo', Foco: 'Liderança', 'Foco secundário': 'Cooperação' })]);
    expect(selected[0]!.data).toMatchObject({ format_id: 'fmt-quebra', focus_id: 'foc-lider', secondary_focus_id: 'foc-coop' });
  });

  it('ignores a secondary focus equal to the main one and an unknown one, and says so', () => {
    const same = plan([row({ Foco: 'Cooperação', 'Foco secundário': 'Cooperação' })]);
    expect(same.selected[0]!.data.secondary_focus_id).toBeNull();
    expect(same.report.notes).toContainEqual(expect.objectContaining({ note: expect.stringContaining('foco secundário') }));
    const unknown = plan([row({ 'Foco secundário': 'Sustentabilidade' })]);
    expect(unknown.selected[0]!.data.secondary_focus_id).toBeNull();
    expect(unknown.report.droppedValues).toContainEqual(
      expect.objectContaining({ externalId: 'ATV-1', field: 'foco secundário', values: ['Sustentabilidade'] })
    );
  });

  it('keeps the single duration and stores the range next to it', () => {
    const { selected } = plan([row({ Mins: '20', duracao_min: '15', duracao_max: '30' })]);
    expect(selected[0]!.data).toMatchObject({ approximate_duration_minutes: 20, duration_min_minutes: 15, duration_max_minutes: 30 });
  });

  it('notes a single duration outside its range, and ignores an inverted range', () => {
    const outside = plan([row({ Mins: '45', duracao_min: '15', duracao_max: '30' })]);
    expect(outside.report.notes).toContainEqual(expect.objectContaining({ note: expect.stringContaining('fora do intervalo') }));
    const inverted = plan([row({ Mins: '20', duracao_min: '40', duracao_max: '30' })]);
    expect(inverted.selected[0]!.data.duration_min_minutes).toBeNull();
    expect(inverted.report.notes).toContainEqual(expect.objectContaining({ note: expect.stringContaining('intervalo de duração ignorado') }));
  });

  it('carries the sheet id and the Publicada cell, and counts the review fields', () => {
    const { selected, report } = plan([row({ Publicada: 'TRUE' }), row({ atividade_id: 'ATV-2', Nome: 'Outra', variantes: 'mesmo jogo que X', confianca: 'média' })]);
    expect(selected.map((s) => [s.externalId, s.published, s.data.external_id])).toEqual([
      ['ATV-1', true, 'ATV-1'],
      ['ATV-2', false, 'ATV-2'],
    ]);
    expect(report.reviewStates).toEqual({ estado: { revisto_por_claude: 2 }, confianca: { alta: 1, média: 1 }, variantes: 1 });
  });

  it('ignores the blocks written for Dirigentes on purpose and keeps the other divisions', () => {
    const withGoals = {
      ...taxonomies,
      goals: [
        { id: 'g-4e11', code: '4E.1.1', age_groups: ['cub_scouts'] },
        { id: 'g-5i34', code: '5I.3-4', age_groups: ['adventurers', 'rovers'] },
      ],
    };
    const headers = [...HEADERS, 'Objetivos educativos (por divisão)', 'Comportamentos a observar (objetivos)'];
    const objectives =
      'Lobitos:\n• 4E.1.1 Participar em momentos de partilha\n\nDirigentes (referência: objetivos de Caminheiros):\n• 5I.3-4 Demonstrar criatividade';
    const behaviours = 'Lobitos:\n• 4E.1.1: aceita fazer parte da equipa.\n\nDirigentes (referência: Caminheiros):\n• 5I.3-4: dá o exemplo.';
    const result = planBaselineLoad(
      headers,
      [row({ Divisão: 'Lobitos, Dirigentes', 'Objetivos educativos (por divisão)': objectives, 'Comportamentos a observar (objetivos)': behaviours })],
      withGoals,
      { limit: 10, seed: 1 }
    );
    expect(result.selected[0]!.data.age_groups).toEqual(['cub_scouts', 'leaders']);
    expect(result.selected[0]!.data.objectives).toEqual([{ goal_id: 'g-4e11', age_group: 'cub_scouts', behaviour: 'aceita fazer parte da equipa.' }]);
    expect(result.report.ignored.dirigentesBlocks).toBe(1);
    expect(result.report.droppedValues.filter((d) => d.field.startsWith('objetivos') || d.field.startsWith('comportamentos'))).toEqual([]);
  });

  it('does not de-duplicate by name rows that have a sheet id', () => {
    const { selected } = plan([row({ atividade_id: 'ATV-1', Nome: 'Mesmo nome' }), row({ atividade_id: 'ATV-2', Nome: 'Mesmo nome' })]);
    expect(selected.map((s) => s.externalId)).toEqual(['ATV-1', 'ATV-2']);
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

  it('skips duplicates without a sheet id that share a name and an age group, in the file and in the catalogue', () => {
    const { selected, report } = plan(
      [
        row({ atividade_id: '', Nome: 'Jogo  da   BANDEIRA', Divisão: 'Escoteiros, Lobitos' }),
        row({ atividade_id: '', Nome: 'jogo da bandeira', Divisão: 'Lobitos' }),
        row({ atividade_id: '', Nome: 'Jogo da Bandeira', Divisão: 'Caminheiros' }),
        row({ atividade_id: '', Nome: 'Já Existe', Divisão: 'Escoteiros' }),
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

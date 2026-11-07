import { describe, expect, it } from 'vitest';
import {
  cleanOptionalText,
  isPlaceholder,
  mapActivityTypes,
  mapAgeGroups,
  mapEffort,
  mapGroupSizes,
  mapLocations,
  mapSdgs,
  normalizeHeader,
  normalizeText,
  parseDuration,
  resolveColumns,
  splitList,
} from '@/lib/activities/baseline-map';

describe('parseDuration', () => {
  it.each([
    ['30', 30],
    [45, 45],
    ['20min', 20],
    ['20 min', 20],
    ['1h', 60],
    ['1h30', 90],
    ['1,5 h', 90],
    ['2 horas', 120],
  ])('reads %s as %s minutes', (raw, minutes) => {
    expect(parseDuration(raw)).toEqual({ ok: true, minutes });
  });

  it.each(['15-30', '20/30 min', '15 – 30'])('collapses the range %s to its upper bound and notes it', (raw) => {
    const result = parseDuration(raw);
    expect(result).toMatchObject({ ok: true, minutes: 30 });
    expect(result.ok && result.note).toContain('30');
  });

  it.each(['', '-', null, undefined, 'meia hora', '0', '0h'])('rejects %s', (raw) => {
    expect(parseDuration(raw).ok).toBe(false);
  });
});

describe('placeholders and lists', () => {
  it('treats empty and dash cells as placeholders', () => {
    for (const value of ['', ' ', '-', '—', null, undefined]) expect(isPlaceholder(value)).toBe(true);
    expect(isPlaceholder('Cordas')).toBe(false);
  });

  it('splits on commas, semicolons and line breaks', () => {
    expect(splitList('Pequeno (2-6), Médio (7-15);Grande\n-')).toEqual(['Pequeno (2-6)', 'Médio (7-15)', 'Grande']);
    expect(splitList('-')).toEqual([]);
  });

  it('normalises text and headers', () => {
    expect(normalizeText('  Médio   (7-15) ')).toBe('medio (7-15)');
    expect(normalizeHeader('Intruções?')).toBe('intrucoes');
    expect(normalizeHeader('Atividade_ID')).toBe('atividade_id');
  });

  it('turns "-" into no value for optional text', () => {
    expect(cleanOptionalText('-')).toBeNull();
    expect(cleanOptionalText(' 1. Jogar ')).toBe('1. Jogar');
  });
});

describe('category mapping keeps every recognised value', () => {
  it('maps group sizes from labels or keys', () => {
    expect(mapGroupSizes('Pequeno (2-6), Grande (16+)')).toEqual({ values: ['small', 'large'], dropped: [] });
    expect(mapGroupSizes('medium')).toEqual({ values: ['medium'], dropped: [] });
    expect(mapGroupSizes('')).toEqual({ values: [], dropped: [] });
  });

  it('maps locations, including "ambos", and reports unknown ones', () => {
    expect(mapLocations('Interior, Exterior')).toEqual({ values: ['inside', 'outside'], dropped: [] });
    expect(mapLocations('ambos').values).toEqual(['inside', 'outside']);
    expect(mapLocations('Exterior, Lua')).toEqual({ values: ['outside'], dropped: ['Lua'] });
  });

  it('maps a multi-division cell to several age groups', () => {
    expect(mapAgeGroups('Lobitos, Escoteiros; Exploradores')).toEqual({
      values: ['cub_scouts', 'scouts', 'adventurers'],
      dropped: [],
    });
    expect(mapAgeGroups('Escoteiros (10-14), Escoteiros')).toEqual({ values: ['scouts'], dropped: [] });
    expect(mapAgeGroups('Pioneiros, Exploradores')).toEqual({ values: ['adventurers'], dropped: [] });
    expect(mapAgeGroups('Caminheiros, Marcianos')).toEqual({ values: ['rovers'], dropped: ['Marcianos'] });
  });

  it('maps effort to a single value', () => {
    expect(mapEffort('Baixo')).toEqual({ value: 'low', dropped: [] });
    expect(mapEffort('Alto, Médio')).toEqual({ value: 'high', dropped: ['Médio'] });
    expect(mapEffort('').value).toBeNull();
  });

  it('matches activity types by name only and reports the rest', () => {
    const types = [
      { id: 't1', name: 'Jogo' },
      { id: 't2', name: 'Expressão Dramática' },
    ];
    expect(mapActivityTypes('jogo, expressao dramatica, Culinária', types)).toEqual({
      values: ['t1', 't2'],
      dropped: ['Culinária'],
    });
  });

  it('matches SDGs by number or name', () => {
    const sdgs = [
      { id: 's4', number: 4, name: 'Educação de Qualidade' },
      { id: 's13', number: 13, name: 'Ação Climática' },
    ];
    expect(mapSdgs('4; ODS 13', sdgs).values).toEqual(['s4', 's13']);
    expect(mapSdgs('Ação climática, Paz', sdgs)).toEqual({ values: ['s13'], dropped: ['Paz'] });
  });
});

describe('resolveColumns', () => {
  it('finds columns regardless of accents, case and punctuation', () => {
    const resolved = resolveColumns(['atividade_id', 'Nome', 'Descrição', 'Mins', 'Intruções?', 'Divisão', 'Esforço']);
    expect(resolved).toMatchObject({
      external_id: 'atividade_id',
      name: 'Nome',
      description: 'Descrição',
      minutes: 'Mins',
      instructions: 'Intruções?',
      age: 'Divisão',
      effort: 'Esforço',
    });
  });
});

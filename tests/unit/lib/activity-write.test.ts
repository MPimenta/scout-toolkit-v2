import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/server', () => ({ db: {} }));

import { INSTRUCTIONS_MAX_LENGTH, parseActivityWrite } from '@/lib/activities/write';

const valid = {
  name: 'Jogo',
  description: 'Desc',
  materials: 'Nada',
  approximate_duration_minutes: 30,
  group_sizes: ['small'],
  effort_level: 'low',
  locations: ['outside'],
  age_groups: ['scouts'],
  format_id: '6f1c2d4e-0a1b-4c3d-8e5f-0123456789ab',
  focus_id: '7a2d3e5f-1b2c-4d4e-9f60-123456789abc',
};

describe('parseActivityWrite: format, focus and duration range', () => {
  it('keeps the format, the main focus and the optional secondary focus', () => {
    expect(parseActivityWrite({ ...valid, secondary_focus_id: '8b3e4f60-2c3d-4e5f-a071-23456789abcd' })).toMatchObject({
      format_id: '6f1c2d4e-0a1b-4c3d-8e5f-0123456789ab',
      focus_id: '7a2d3e5f-1b2c-4d4e-9f60-123456789abc',
      secondary_focus_id: '8b3e4f60-2c3d-4e5f-a071-23456789abcd',
    });
    expect(parseActivityWrite(valid)).toMatchObject({ secondary_focus_id: null });
  });

  it('rejects a missing format or main focus with a Portuguese message', () => {
    const { format_id: _f, ...noFormat } = valid as Record<string, unknown>;
    const { focus_id: _o, ...noFocus } = valid as Record<string, unknown>;
    expect(parseActivityWrite(noFormat)).toBe('Indique o formato da atividade');
    expect(parseActivityWrite(noFocus)).toBe('Indique o foco principal da atividade');
    expect(parseActivityWrite({ ...valid, format_id: 'not-a-uuid' })).toBe('Formato inválido');
    expect(parseActivityWrite({ ...valid, focus_id: 'not-a-uuid' })).toBe('Foco principal inválido');
  });

  it('rejects a secondary focus equal to the main one or malformed', () => {
    expect(parseActivityWrite({ ...valid, secondary_focus_id: '7a2d3e5f-1b2c-4d4e-9f60-123456789abc' })).toBe(
      'O foco secundário tem de ser diferente do foco principal'
    );
    expect(parseActivityWrite({ ...valid, secondary_focus_id: 'x' })).toBe('Foco secundário inválido');
  });

  it('stores an optional duration range and rejects an inverted or invalid one', () => {
    expect(parseActivityWrite({ ...valid, duration_min_minutes: 20, duration_max_minutes: '40' })).toMatchObject({
      duration_min_minutes: 20,
      duration_max_minutes: 40,
    });
    expect(parseActivityWrite(valid)).toMatchObject({ duration_min_minutes: null, duration_max_minutes: null });
    expect(parseActivityWrite({ ...valid, duration_min_minutes: 40, duration_max_minutes: 20 })).toBe(
      'A duração mínima não pode exceder a máxima'
    );
    expect(parseActivityWrite({ ...valid, duration_min_minutes: 0 })).toBe('Duração mínima ou máxima inválida');
    expect(parseActivityWrite({ ...valid, duration_max_minutes: 'abc' })).toBe('Duração mínima ou máxima inválida');
  });

  it('accepts the five risk levels', () => {
    for (const level of ['low', 'low_medium', 'medium', 'medium_high', 'high']) {
      expect(parseActivityWrite({ ...valid, physical_risk_level: level })).toMatchObject({ physical_risk_level: level });
    }
    expect(parseActivityWrite({ ...valid, physical_risk_level: 'extreme' })).toBe('Nível de risco inválido (físico)');
  });

  it('never takes the sheet id from the request body', () => {
    expect(parseActivityWrite({ ...valid, external_id: 'ATV-0001' })).not.toHaveProperty('external_id', 'ATV-0001');
  });
});

describe('parseActivityWrite', () => {
  it('accepts an HTTPS image URL', () => {
    const parsed = parseActivityWrite({
      ...valid,
      image_url: 'https://utfs.io/image.jpg',
    });
    expect(parsed).toMatchObject({ image_url: 'https://utfs.io/image.jpg' });
  });

  it('stores trimmed multi-line instructions', () => {
    const parsed = parseActivityWrite({ ...valid, instructions: '  1. Dividir\n2. Jogar  ' });
    expect(parsed).toMatchObject({ instructions: '1. Dividir\n2. Jogar' });
  });

  it('treats missing or blank instructions as null', () => {
    expect(parseActivityWrite(valid)).toMatchObject({ instructions: null });
    expect(parseActivityWrite({ ...valid, instructions: '   ' })).toMatchObject({ instructions: null });
  });

  it('rejects instructions over the length cap', () => {
    expect(
      parseActivityWrite({ ...valid, instructions: 'x'.repeat(INSTRUCTIONS_MAX_LENGTH + 1) })
    ).toBe(`As instruções não podem exceder ${INSTRUCTIONS_MAX_LENGTH} caracteres`);
  });

  it('rejects a non-HTTPS image URL', () => {
    expect(parseActivityWrite({ ...valid, image_url: 'http://example.com/a.jpg' })).toBe(
      'A imagem deve usar um URL HTTPS'
    );
  });

  describe('category lists', () => {
    it('keeps several values per category', () => {
      const parsed = parseActivityWrite({
        ...valid,
        group_sizes: ['small', 'large'],
        locations: ['inside', 'outside'],
        age_groups: ['cub_scouts', 'scouts'],
      });
      expect(parsed).toMatchObject({
        group_sizes: ['small', 'large'],
        locations: ['inside', 'outside'],
        age_groups: ['cub_scouts', 'scouts'],
      });
    });

    it('collapses duplicate values', () => {
      const parsed = parseActivityWrite({ ...valid, locations: ['inside', 'inside'] });
      expect(parsed).toMatchObject({ locations: ['inside'] });
    });

    it.each(['group_sizes', 'locations', 'age_groups'])(
      'rejects an empty or missing %s',
      (field) => {
        expect(typeof parseActivityWrite({ ...valid, [field]: [] })).toBe('string');
        const { [field]: _removed, ...rest } = valid as Record<string, unknown>;
        expect(typeof parseActivityWrite(rest)).toBe('string');
      }
    );

    it('rejects unknown enum values', () => {
      expect(parseActivityWrite({ ...valid, age_groups: ['wizards'] })).toBe('Valor inválido para secção');
    });

    it('ignores the removed activity_type_ids field', () => {
      const parsed = parseActivityWrite({ ...valid, activity_type_ids: ['not-a-uuid'] });
      expect(typeof parsed).toBe('object');
      expect(parsed).not.toHaveProperty('activity_type_ids');
    });

    it('does not accept the old single-valued fields', () => {
      const { group_sizes: _g, ...rest } = valid as Record<string, unknown>;
      expect(typeof parseActivityWrite({ ...rest, group_size: 'small' })).toBe('string');
    });
  });
});

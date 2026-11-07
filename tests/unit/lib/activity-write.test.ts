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
  activity_type_ids: ['550e8400-e29b-41d4-a716-446655440000'],
};

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
        activity_type_ids: [
          '550e8400-e29b-41d4-a716-446655440000',
          '550e8400-e29b-41d4-a716-446655440001',
        ],
      });
      expect(parsed).toMatchObject({
        group_sizes: ['small', 'large'],
        locations: ['inside', 'outside'],
        age_groups: ['cub_scouts', 'scouts'],
      });
      expect(typeof parsed === 'object' && parsed.activity_type_ids).toHaveLength(2);
    });

    it('collapses duplicate values', () => {
      const parsed = parseActivityWrite({ ...valid, locations: ['inside', 'inside'] });
      expect(parsed).toMatchObject({ locations: ['inside'] });
    });

    it.each(['group_sizes', 'locations', 'age_groups', 'activity_type_ids'])(
      'rejects an empty or missing %s',
      (field) => {
        expect(typeof parseActivityWrite({ ...valid, [field]: [] })).toBe('string');
        const { [field]: _removed, ...rest } = valid as Record<string, unknown>;
        expect(typeof parseActivityWrite(rest)).toBe('string');
      }
    );

    it('rejects unknown enum values and malformed type ids', () => {
      expect(parseActivityWrite({ ...valid, age_groups: ['wizards'] })).toBe('Valor inválido para secção');
      expect(parseActivityWrite({ ...valid, activity_type_ids: ['not-a-uuid'] })).toBe(
        'Tipo de atividade inválido'
      );
    });

    it('does not accept the old single-valued fields', () => {
      const { group_sizes: _g, ...rest } = valid as Record<string, unknown>;
      expect(typeof parseActivityWrite({ ...rest, group_size: 'small' })).toBe('string');
    });
  });
});

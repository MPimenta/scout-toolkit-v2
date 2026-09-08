import { describe, expect, it, vi } from 'vitest';

const { mockDeleteWhere, mockInsertValues, mockSelectWhere } = vi.hoisted(() => ({
  mockDeleteWhere: vi.fn(),
  mockInsertValues: vi.fn(),
  mockSelectWhere: vi.fn(),
}));

vi.mock('@/lib/db/server', () => ({
  db: {
    delete: () => ({ where: (...args: unknown[]) => mockDeleteWhere(...args) }),
    insert: () => ({ values: (...args: unknown[]) => mockInsertValues(...args) }),
    select: () => ({
      from: () => ({
        where: (...args: unknown[]) => mockSelectWhere(...args),
      }),
    }),
  },
}));

import { parseActivityWrite, replaceRelations, validateChallengeIds } from '@/lib/activities/write';

const valid = {
  name: 'Jogo',
  description: 'Desc',
  materials: 'Nada',
  approximate_duration_minutes: 30,
  group_size: 'small',
  effort_level: 'low',
  location: 'outside',
  age_group: 'scouts',
  activity_type_id: '550e8400-e29b-41d4-a716-446655440000',
};

describe('parseActivityWrite', () => {
  it('accepts an HTTPS image URL', () => {
    const parsed = parseActivityWrite({
      ...valid,
      image_url: 'https://utfs.io/image.jpg',
    });
    expect(parsed).toMatchObject({ image_url: 'https://utfs.io/image.jpg' });
  });

  it('rejects a non-HTTPS image URL', () => {
    expect(parseActivityWrite({ ...valid, image_url: 'http://example.com/a.jpg' })).toBe(
      'A imagem deve usar um URL HTTPS'
    );
  });

  it('parses challenge_ids and defaults to an empty list', () => {
    expect(parseActivityWrite(valid)).toMatchObject({ challenge_ids: [] });
    expect(
      parseActivityWrite({
        ...valid,
        challenge_ids: ['550e8400-e29b-41d4-a716-446655440001'],
      })
    ).toMatchObject({
      challenge_ids: ['550e8400-e29b-41d4-a716-446655440001'],
    });
  });
});

describe('validateChallengeIds', () => {
  it('accepts an empty list without querying', async () => {
    mockSelectWhere.mockClear();
    await expect(validateChallengeIds([])).resolves.toBeNull();
    expect(mockSelectWhere).not.toHaveBeenCalled();
  });

  it('returns an error when a challenge id is unknown', async () => {
    mockSelectWhere.mockResolvedValue([]);
    await expect(validateChallengeIds(['550e8400-e29b-41d4-a716-446655440099'])).resolves.toBe(
      'Desafio inválido'
    );
  });

  it('accepts ids that all exist', async () => {
    mockSelectWhere.mockResolvedValue([{ id: '550e8400-e29b-41d4-a716-446655440001' }]);
    await expect(
      validateChallengeIds(['550e8400-e29b-41d4-a716-446655440001'])
    ).resolves.toBeNull();
  });
});

describe('replaceRelations', () => {
  const write = {
    ...valid,
    challenge_ids: ['550e8400-e29b-41d4-a716-446655440001'],
  };

  it('inserts challenge relations when ids are present', async () => {
    mockDeleteWhere.mockResolvedValue(undefined);
    mockInsertValues.mockResolvedValue(undefined);
    await replaceRelations('act-1', write);
    expect(mockInsertValues).toHaveBeenCalledWith([
      { activity_id: 'act-1', challenge_id: '550e8400-e29b-41d4-a716-446655440001' },
    ]);
  });

  it('clears challenge relations when the list is empty', async () => {
    mockDeleteWhere.mockResolvedValue(undefined);
    mockInsertValues.mockClear();
    await replaceRelations('act-1', { ...write, challenge_ids: [] });
    expect(mockDeleteWhere).toHaveBeenCalled();
    expect(mockInsertValues).not.toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ challenge_id: expect.any(String) })])
    );
  });
});

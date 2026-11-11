import { describe, expect, it } from 'vitest';
import { filterMembers, normalizeSearchText } from '@/lib/orgo/members';

const members = [
  { id: '1', name: 'João Pereira', cardId: '10231', type: 'Explorador' },
  { id: '2', name: 'Joana Silva Santos', cardId: '10450', type: 'Lobito' },
  { id: '3', name: 'Rita Exemplo', cardId: null, type: 'Dirigente' },
];

describe('normalizeSearchText', () => {
  it('ignores accents and case', () => {
    expect(normalizeSearchText('  JOÃO  ')).toBe('joao');
  });
});

describe('filterMembers', () => {
  it('returns everyone for an empty search', () => {
    expect(filterMembers(members, '   ')).toHaveLength(3);
  });

  it('finds a name without typing the accents', () => {
    expect(filterMembers(members, 'joao').map((m) => m.id)).toEqual(['1']);
  });

  it('matches part of a name', () => {
    expect(filterMembers(members, 'jo').map((m) => m.id)).toEqual(['1', '2']);
  });

  it('needs every word of the query to match the name', () => {
    expect(filterMembers(members, 'joana santos').map((m) => m.id)).toEqual(['2']);
    expect(filterMembers(members, 'joana pereira')).toEqual([]);
  });

  it('finds a member by card number', () => {
    expect(filterMembers(members, '10231').map((m) => m.id)).toEqual(['1']);
  });

  it('does not match a member without a card number on digits', () => {
    expect(filterMembers(members, '999')).toEqual([]);
  });
});

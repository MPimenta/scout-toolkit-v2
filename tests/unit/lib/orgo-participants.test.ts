import { describe, expect, it } from 'vitest';
import type { OrgoLocalUnit, OrgoMember } from '@/lib/orgo/client';
import {
  MAX_PARTICIPANTS,
  NO_DIVISION_ID,
  buildParticipantTree,
  findForgedMemberIds,
  offeredMemberIds,
} from '@/lib/orgo/participants';

const unit = (
  id: string,
  name: string,
  kind: OrgoLocalUnit['kind'],
  userType: string | null,
  parentId: string | null = null
): OrgoLocalUnit => ({ id, name, kind, userType, parentId });

const units: OrgoLocalUnit[] = [
  unit('3254', 'Tribo de Exploradores', 'divisao', 'Explorador'),
  unit('3284', 'Alcateia', 'divisao', 'Lobito'),
  unit('3276', 'Chefia', 'divisao', 'Dirigente'),
  unit('3279', 'Patrulha Javali', 'patrulha', 'Explorador', '3254'),
];

const member = (id: string, name: string, type: string | null, cardId: string | null = null): OrgoMember => ({
  id,
  name,
  cardId,
  type,
});

describe('buildParticipantTree', () => {
  const members = [
    member('1', 'Rui Teste', 'Lobito', '10001'),
    member('2', 'Ana Exemplo', 'Explorador', '10002'),
    member('3', 'Inês Modelo', 'Explorador', '10003'),
    member('4', 'Marta Dirigente', 'Dirigente', '10004'),
    member('5', 'Sem Tipo', null),
    member('6', 'Caminheiro Sem Clã', 'Caminheiro'),
  ];

  it('puts each member in the divisão that holds their type, in the usual order', () => {
    const tree = buildParticipantTree(members, units, 'Grupo 312 Coimbra');
    expect(tree.groupName).toBe('Grupo 312 Coimbra');
    expect(tree.divisions.map((d) => [d.name, d.count])).toEqual([
      ['Alcateia', 1],
      ['Tribo de Exploradores', 2],
      ['Chefia', 1],
      ['Outros membros', 2],
    ]);
    expect(tree.members.find((m) => m.id === '2')?.divisionId).toBe('3254');
  });

  it('does not offer patrulhas as a level, and lists members of an unmatched type under "Outros"', () => {
    const tree = buildParticipantTree(members, units, null);
    expect(tree.divisions.some((d) => d.name.startsWith('Patrulha'))).toBe(false);
    const others = tree.members.filter((m) => m.divisionId === NO_DIVISION_ID).map((m) => m.id);
    expect(others.sort()).toEqual(['5', '6']);
  });

  it('keeps the total of the whole group even when a search narrows the list', () => {
    const tree = buildParticipantTree(members, units, null, 'ana');
    expect(tree.total).toBe(6);
    expect(tree.members.map((m) => m.id)).toEqual(['2']);
    expect(tree.divisions.map((d) => d.name)).toEqual(['Tribo de Exploradores']);
  });

  it('finds a member by card number', () => {
    const tree = buildParticipantTree(members, units, null, '10004');
    expect(tree.members.map((m) => m.name)).toEqual(['Marta Dirigente']);
  });

  it('sorts members by name within the list', () => {
    const tree = buildParticipantTree(members, units, null);
    const names = tree.members.map((m) => m.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'pt')));
  });

  it('handles a group without members or units', () => {
    expect(buildParticipantTree([], [], null)).toEqual({ groupName: null, divisions: [], members: [], total: 0 });
  });
});

describe('offered ids', () => {
  const offered = offeredMemberIds([member('1', 'A', null), member('2', 'B', null)]);

  it('accepts only ids that were offered', () => {
    expect(findForgedMemberIds(['1', '2'], offered)).toEqual([]);
    expect(findForgedMemberIds(['1', '99'], offered)).toEqual(['99']);
  });

  it('caps a request at 500 participants', () => {
    expect(MAX_PARTICIPANTS).toBe(500);
  });
});

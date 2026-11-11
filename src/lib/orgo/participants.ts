import type { OrgoLocalUnit, OrgoMember } from './client';
import { filterMembers } from './members';
import type { ParticipantDivision, ParticipantMember, ParticipantTree } from '@/types/orgo-participants';

/** At most this many participants are accepted in one request. */
export const MAX_PARTICIPANTS = 500;

/** Id of the bucket for members whose type matches no divisão of the group. */
export const NO_DIVISION_ID = 'none';

const TYPE_ORDER = ['Lobito', 'Explorador', 'Escoteiro', 'Caminheiro', 'Dirigente'];

function typeRank(userType: string | null): number {
  const index = userType ? TYPE_ORDER.indexOf(userType) : -1;
  return index === -1 ? TYPE_ORDER.length : index;
}

/**
 * Members of one local group, grouped by divisão. Orgo does not say which unit a member
 * belongs to, but each divisão holds one member type, so a member goes to the divisão whose
 * type matches theirs. (Patrulhas are not a level: Orgo does not expose who is in one.)
 */
export function buildParticipantTree(
  members: OrgoMember[],
  units: OrgoLocalUnit[],
  groupName: string | null,
  query = ''
): ParticipantTree {
  const divisionUnits = units
    .filter((unit) => unit.kind === 'divisao')
    .sort((a, b) => typeRank(a.userType) - typeRank(b.userType) || a.name.localeCompare(b.name));

  const divisionForType = new Map<string, string>();
  for (const unit of divisionUnits) {
    if (unit.userType && !divisionForType.has(unit.userType)) divisionForType.set(unit.userType, unit.id);
  }

  const shown = filterMembers(members, query);
  const placed: ParticipantMember[] = shown.map((member) => ({
    id: member.id,
    name: member.name,
    cardId: member.cardId,
    divisionId: (member.type && divisionForType.get(member.type)) || NO_DIVISION_ID,
  }));
  placed.sort((a, b) => a.name.localeCompare(b.name, 'pt'));

  const counts = new Map<string, number>();
  for (const member of placed) counts.set(member.divisionId, (counts.get(member.divisionId) ?? 0) + 1);

  const divisions: ParticipantDivision[] = divisionUnits
    .map((unit) => ({ id: unit.id, name: unit.name, userType: unit.userType, count: counts.get(unit.id) ?? 0 }))
    .filter((division) => division.count > 0);
  const others = counts.get(NO_DIVISION_ID) ?? 0;
  if (others > 0) divisions.push({ id: NO_DIVISION_ID, name: 'Outros membros', userType: null, count: others });

  return { groupName, divisions, members: placed, total: members.length };
}

/** The ids of every member the leader may invite: the only ids the server accepts. */
export function offeredMemberIds(members: OrgoMember[]): Set<string> {
  return new Set(members.map((member) => member.id));
}

/** Ids in the request that were not offered to this leader. */
export function findForgedMemberIds(requested: string[], offered: Set<string>): string[] {
  return requested.filter((id) => !offered.has(id));
}

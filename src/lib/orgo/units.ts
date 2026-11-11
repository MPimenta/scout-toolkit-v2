import { getOrgoUnit, listLocalCenterUnits, type OrgoLocalUnit, type OrgoUnitOption } from './client';
import type { LeaderScope } from './scope';

export interface LeaderUnits {
  /** Units the leader may create the event in: their group, its divisões and patrulhas. */
  units: OrgoUnitOption[];
  /** The divisões and patrulhas of the group, for the participant tree. */
  localUnits: OrgoLocalUnit[];
  groupName: string | null;
}

/**
 * The units of the leader's own local group. The group-level unit has the same id as the
 * local group. Nothing outside the leader's group is ever offered.
 */
export async function loadLeaderUnits(scope: LeaderScope): Promise<LeaderUnits> {
  const [group, localUnits] = await Promise.all([
    getOrgoUnit(scope.localCenterId),
    listLocalCenterUnits(scope.localCenterId),
  ]);

  const byId = new Map(localUnits.map((unit) => [unit.id, unit]));
  const label = (unit: OrgoLocalUnit): string => {
    const parent = unit.parentId ? byId.get(unit.parentId) : undefined;
    return unit.kind === 'patrulha' && parent ? `${unit.name} (${parent.name})` : unit.name;
  };

  const divisions = localUnits.filter((unit) => unit.kind === 'divisao');
  const patrols = localUnits.filter((unit) => unit.kind === 'patrulha');
  const options: OrgoUnitOption[] = [
    ...(group ? [{ iri: `/api/v1/units/${group.id}`, name: group.name }] : []),
    ...[...divisions, ...patrols].map((unit) => ({ iri: `/api/v1/units/${unit.id}`, name: label(unit) })),
  ];

  return { units: options, localUnits, groupName: group?.name ?? null };
}

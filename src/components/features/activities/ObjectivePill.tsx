import { DivisionPill } from '@/components/ui/DivisionPill';
import { DIVISIONS } from '@/lib/design/tokens';

export interface ObjectiveLike {
  id?: string;
  code: string;
  title?: string | null;
  age_groups?: readonly string[] | null;
}

interface ObjectivePillProps {
  objective: ObjectiveLike;
  /**
   * The activity's age groups. One pill is shown per age group the objective shares with
   * the activity (a shared "3-4" objective on a two-division activity shows two pills).
   * Without it, the objective's own age groups are used (filters, pickers).
   */
  activityAgeGroups?: readonly string[] | null;
  className?: string;
}

const ORDER = DIVISIONS.map((division) => division.ageGroup as string);

/** The age groups an objective pill should be drawn for. Empty means "no known division". */
export function pillAgeGroups(
  objective: ObjectiveLike,
  activityAgeGroups?: readonly string[] | null
): string[] {
  const own = objective.age_groups ?? [];
  const shared = activityAgeGroups ? own.filter((group) => activityAgeGroups.includes(group)) : [...own];
  return [...new Set(shared)].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
}

/**
 * Objective code as a pill in the colour of its division. Falls back to a neutral pill
 * when the objective has no matching division (legacy, admin-created objectives).
 */
export function ObjectivePill({ objective, activityAgeGroups, className }: ObjectivePillProps) {
  const groups = pillAgeGroups(objective, activityAgeGroups);
  const title = objective.title ?? undefined;
  if (groups.length === 0) {
    return <DivisionPill ageGroup="" code={objective.code} title={title} className={className} />;
  }
  return (
    <>
      {groups.map((group) => (
        <DivisionPill key={group} ageGroup={group} code={objective.code} title={title} className={className} />
      ))}
    </>
  );
}

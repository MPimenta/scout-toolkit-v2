import { Clock, MapPin, Target, Users, type LucideIcon } from 'lucide-react';

/**
 * One icon per kind of activity fact. Every screen that shows duration, group size, effort or
 * location uses these (detail, card, table, filters). A test fails if another icon is used.
 */
export const FACT_ICONS = {
  duration: Clock,
  groupSize: Users,
  effort: Target,
  location: MapPin,
} as const satisfies Record<string, LucideIcon>;

export type FactKind = keyof typeof FACT_ICONS;

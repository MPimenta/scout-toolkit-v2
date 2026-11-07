/** State of the catalogue filter panel (what the user has chosen). */
export interface FilterState {
  search: string;
  groupSize: string[];
  effortLevel: string[];
  location: string[];
  ageGroup: string[];
  activityType: string[];
  sdgs: string[];
  /** Specific objective ids. */
  educationalGoals: string[];
  /** Educational area ids: any objective in the area. */
  educationalAreas: string[];
  /** General objective ids: any objective under them. */
  generalObjectives: string[];
  /** Inclusive bounds in minutes; empty means open. */
  durationMin: string;
  durationMax: string;
}

export const EMPTY_FILTERS: FilterState = {
  search: '',
  groupSize: [],
  effortLevel: [],
  location: [],
  ageGroup: [],
  activityType: [],
  sdgs: [],
  educationalGoals: [],
  educationalAreas: [],
  generalObjectives: [],
  durationMin: '',
  durationMax: '',
};

/** True when at least one filter is set. */
export function hasActiveFilters(filters: FilterState): boolean {
  return Object.values(filters).some((value) => (Array.isArray(value) ? value.length > 0 : value !== ''));
}

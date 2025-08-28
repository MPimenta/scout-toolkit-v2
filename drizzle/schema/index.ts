// Database schema exports
export * from './users';
export * from './taxonomies';
export * from './activities';
export * from './programs';
export * from './feedback';

// Export all tables for Drizzle
import { users, userRoles } from './users';
import { activityTypes, educationalAreas, educationalGoals, sdgs } from './taxonomies';
import { activities, activityEducationalGoals, activitySdgs } from './activities';
import { programs, programEntries } from './programs';
import { reviews, editSuggestions } from './feedback';

export const schema = {
  users,
  userRoles,
  activityTypes,
  educationalAreas,
  educationalGoals,
  sdgs,
  activities,
  activityEducationalGoals,
  activitySdgs,
  programs,
  programEntries,
  reviews,
  editSuggestions,
};

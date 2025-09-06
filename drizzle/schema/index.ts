// Database schema exports
export * from './users';
export * from './taxonomies';
export * from './activities';
export * from './programs';
export * from './feedback';
export * from './auth';

// Export all tables for Drizzle
import { users, userRoles } from './users';
import { activityTypes, educationalAreas, educationalGoals, sdgs } from './taxonomies';
import { activities, activityEducationalGoals, activitySdgs } from './activities';
import { programs, programEntries } from './programs';
import { reviews, editSuggestions } from './feedback';
import { user, account, session, verificationToken } from './auth';

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
  user,
  account,
  session,
  verificationToken,
};

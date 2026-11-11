// Database schema exports
export * from './users';
export * from './taxonomies';
export * from './activities';
export * from './category-values';
export * from './programs';
export * from './feedback';
export * from './auth';
export * from './usage';

// Export all tables for Drizzle
import { users, userRoles } from './users';
import {
  educationalAreas,
  educationalGoals,
  educationalPaths,
  generalObjectives,
  educationalGoalAgeGroups,
  challengeTypes,
  challenges,
  challengeGoals,
  activitySources,
  sdgs,
} from './taxonomies';
import {
  activities,
  activityEducationalGoals,
  activitySdgs,
  activityGroupSizes,
  activityLocations,
  activityAgeGroups,
  activityChallenges,
} from './activities';
import { programs, programEntries } from './programs';
import {
  reviews,
  editSuggestions,
  notifications,
  issueReports,
  reviewVotes,
  reviewReactions,
  reviewReplies,
  replyReactions,
} from './feedback';
import { user, account, session, verificationToken } from './auth';
import { usageEvents } from './usage';

export const schema = {
  users,
  userRoles,
  educationalAreas,
  educationalGoals,
  educationalPaths,
  generalObjectives,
  educationalGoalAgeGroups,
  challengeTypes,
  challenges,
  challengeGoals,
  activitySources,
  sdgs,
  activities,
  activityEducationalGoals,
  activitySdgs,
  activityGroupSizes,
  activityLocations,
  activityAgeGroups,
  activityChallenges,
  programs,
  programEntries,
  reviews,
  editSuggestions,
  notifications,
  issueReports,
  reviewVotes,
  reviewReactions,
  reviewReplies,
  replyReactions,
  user,
  account,
  session,
  verificationToken,
  usageEvents,
};

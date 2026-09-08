// Database schema exports
export * from './users';
export * from './taxonomies';
export * from './activities';
export * from './programs';
export * from './feedback';
export * from './auth';

// Export all tables for Drizzle
import { users, userRoles } from './users';
import { activityTypes, educationalAreas, educationalGoals, challengeTypes, challenges, sdgs } from './taxonomies';
import { activities, activityEducationalGoals, activityChallenges, activitySdgs } from './activities';
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

export const schema = {
  users,
  userRoles,
  activityTypes,
  educationalAreas,
  educationalGoals,
  challengeTypes,
  challenges,
  sdgs,
  activities,
  activityEducationalGoals,
  activityChallenges,
  activitySdgs,
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
};

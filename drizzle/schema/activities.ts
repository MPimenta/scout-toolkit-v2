import { pgTable, text, timestamp, uuid, integer, boolean, primaryKey, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { activityTypes, activitySources, challenges, educationalGoals, sdgs } from './taxonomies';
import { user } from './auth';
import { GROUP_SIZE_VALUES, LOCATION_VALUES, AGE_GROUP_VALUES, RISK_LEVEL_VALUES } from './category-values';

// Activities table
export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  materials: text('materials').notNull(),
  instructions: text('instructions'),
  approximate_duration_minutes: integer('approximate_duration_minutes').notNull(),
  effort_level: text('effort_level', { enum: ['low', 'medium', 'high'] }).notNull(),
  image_url: text('image_url'),
  // Risk analysis: all optional (legacy activities have none)
  physical_risk_level: text('physical_risk_level', { enum: RISK_LEVEL_VALUES }),
  physical_risk: text('physical_risk'),
  physical_mitigation: text('physical_mitigation'),
  psychological_risk_level: text('psychological_risk_level', { enum: RISK_LEVEL_VALUES }),
  psychological_risk: text('psychological_risk'),
  psychological_mitigation: text('psychological_mitigation'),
  // Where the activity comes from
  source_id: uuid('source_id').references(() => activitySources.id, { onDelete: 'set null' }),
  source_url: text('source_url'),
  created_by: uuid('created_by').references(() => user.id),
  is_approved: boolean('is_approved').notNull().default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Performance indexes for frequently queried fields
  isApprovedIdx: index('activities_is_approved_idx').on(table.is_approved),
  effortLevelIdx: index('activities_effort_level_idx').on(table.effort_level),
  durationIdx: index('activities_duration_idx').on(table.approximate_duration_minutes),
  createdAtIdx: index('activities_created_at_idx').on(table.created_at),
  searchIdx: index('activities_search_idx').on(table.is_approved, table.created_at),
}));

// Many-to-many relationships
// One row per (objective, division): the division is the activity age group the objective is
// worked on for (a 'leaders' row references a 'rovers' objective). The behaviour says how to
// observe that the objective was reached.
export const activityEducationalGoals = pgTable('activity_educational_goals', {
  activity_id: uuid('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  goal_id: uuid('goal_id').notNull().references(() => educationalGoals.id, { onDelete: 'cascade' }),
  age_group: text('age_group', { enum: AGE_GROUP_VALUES }).notNull(),
  observable_behaviour: text('observable_behaviour'),
}, (table) => ({
  pk: primaryKey(table.activity_id, table.goal_id, table.age_group),
  activityIdx: index('activity_educational_goals_activity_id_idx').on(table.activity_id),
  goalIdx: index('activity_educational_goals_goal_id_idx').on(table.goal_id),
}));

export const activitySdgs = pgTable('activity_sdgs', {
  activity_id: uuid('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  sdg_id: uuid('sdg_id').notNull().references(() => sdgs.id, { onDelete: 'cascade' }),
  justification: text('justification'),
}, (table) => ({
  pk: primaryKey(table.activity_id, table.sdg_id),
  activityIdx: index('activity_sdgs_activity_id_idx').on(table.activity_id),
  sdgIdx: index('activity_sdgs_sdg_id_idx').on(table.sdg_id),
}));

// Multi-valued categories (an activity can have several of each)
export const activityGroupSizes = pgTable('activity_group_sizes', {
  activity_id: uuid('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  group_size: text('group_size', { enum: GROUP_SIZE_VALUES }).notNull(),
}, (table) => ({
  pk: primaryKey(table.activity_id, table.group_size),
  valueIdx: index('activity_group_sizes_value_idx').on(table.group_size),
}));

export const activityLocations = pgTable('activity_locations', {
  activity_id: uuid('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  location: text('location', { enum: LOCATION_VALUES }).notNull(),
}, (table) => ({
  pk: primaryKey(table.activity_id, table.location),
  valueIdx: index('activity_locations_value_idx').on(table.location),
}));

export const activityAgeGroups = pgTable('activity_age_groups', {
  activity_id: uuid('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  age_group: text('age_group', { enum: AGE_GROUP_VALUES }).notNull(),
}, (table) => ({
  pk: primaryKey(table.activity_id, table.age_group),
  valueIdx: index('activity_age_groups_value_idx').on(table.age_group),
}));

export const activityChallenges = pgTable('activity_challenges', {
  activity_id: uuid('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  challenge_id: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey(table.activity_id, table.challenge_id),
  challengeIdx: index('activity_challenges_challenge_idx').on(table.challenge_id),
}));

export const activityActivityTypes = pgTable('activity_activity_types', {
  activity_id: uuid('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  activity_type_id: uuid('activity_type_id').notNull().references(() => activityTypes.id, { onDelete: 'restrict' }),
}, (table) => ({
  pk: primaryKey(table.activity_id, table.activity_type_id),
  valueIdx: index('activity_activity_types_type_idx').on(table.activity_type_id),
}));

// Zod schemas for validation
export const insertActivitySchema = createInsertSchema(activities);
export const selectActivitySchema = createSelectSchema(activities);

export const insertActivityEducationalGoalSchema = createInsertSchema(activityEducationalGoals);
export const selectActivityEducationalGoalSchema = createSelectSchema(activityEducationalGoals);

export const insertActivitySdgSchema = createInsertSchema(activitySdgs);
export const selectActivitySdgSchema = createSelectSchema(activitySdgs);

// TypeScript types
export type Activity = z.infer<typeof selectActivitySchema>;
export type NewActivity = z.infer<typeof insertActivitySchema>;
export type ActivityEducationalGoal = z.infer<typeof selectActivityEducationalGoalSchema>;
export type NewActivityEducationalGoal = z.infer<typeof insertActivityEducationalGoalSchema>;
export type ActivitySdg = z.infer<typeof selectActivitySdgSchema>;
export type NewActivitySdg = z.infer<typeof insertActivitySdgSchema>;

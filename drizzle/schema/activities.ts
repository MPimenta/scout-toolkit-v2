import { pgTable, text, timestamp, uuid, integer, boolean, primaryKey, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { activityTypes } from './taxonomies';
import { educationalGoals } from './taxonomies';
import { sdgs } from './taxonomies';
import { users } from './users';

// Activities table
export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  materials: text('materials').notNull(),
  approximate_duration_minutes: integer('approximate_duration_minutes').notNull(),
  group_size: text('group_size', { enum: ['small', 'medium', 'large'] }).notNull(),
  effort_level: text('effort_level', { enum: ['low', 'medium', 'high'] }).notNull(),
  location: text('location', { enum: ['inside', 'outside'] }).notNull(),
  age_group: text('age_group', { enum: ['cub_scouts', 'scouts', 'adventurers', 'rovers', 'leaders'] }).notNull(),
  activity_type_id: uuid('activity_type_id').notNull().references(() => activityTypes.id),
  image_url: text('image_url'),
  created_by: uuid('created_by').references(() => users.id),
  is_approved: boolean('is_approved').notNull().default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Performance indexes for frequently queried fields
  isApprovedIdx: index('activities_is_approved_idx').on(table.is_approved),
  groupSizeIdx: index('activities_group_size_idx').on(table.group_size),
  effortLevelIdx: index('activities_effort_level_idx').on(table.effort_level),
  locationIdx: index('activities_location_idx').on(table.location),
  ageGroupIdx: index('activities_age_group_idx').on(table.age_group),
  activityTypeIdx: index('activities_activity_type_id_idx').on(table.activity_type_id),
  durationIdx: index('activities_duration_idx').on(table.approximate_duration_minutes),
  createdAtIdx: index('activities_created_at_idx').on(table.created_at),
  // Composite indexes for common filter combinations
  filterIdx: index('activities_filter_idx').on(table.is_approved, table.group_size, table.effort_level, table.location, table.age_group),
  searchIdx: index('activities_search_idx').on(table.is_approved, table.created_at),
}));

// Many-to-many relationships
export const activityEducationalGoals = pgTable('activity_educational_goals', {
  activity_id: uuid('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  goal_id: uuid('goal_id').notNull().references(() => educationalGoals.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey(table.activity_id, table.goal_id),
  activityIdx: index('activity_educational_goals_activity_id_idx').on(table.activity_id),
  goalIdx: index('activity_educational_goals_goal_id_idx').on(table.goal_id),
}));

export const activitySdgs = pgTable('activity_sdgs', {
  activity_id: uuid('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  sdg_id: uuid('sdg_id').notNull().references(() => sdgs.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey(table.activity_id, table.sdg_id),
  activityIdx: index('activity_sdgs_activity_id_idx').on(table.activity_id),
  sdgIdx: index('activity_sdgs_sdg_id_idx').on(table.sdg_id),
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

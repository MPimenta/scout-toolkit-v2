import { pgTable, text, timestamp, uuid, integer, boolean, primaryKey } from 'drizzle-orm/pg-core';
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
});

// Many-to-many relationships
export const activityEducationalGoals = pgTable('activity_educational_goals', {
  activity_id: uuid('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  goal_id: uuid('goal_id').notNull().references(() => educationalGoals.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey(table.activity_id, table.goal_id),
}));

export const activitySdgs = pgTable('activity_sdgs', {
  activity_id: uuid('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  sdg_id: uuid('sdg_id').notNull().references(() => sdgs.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey(table.activity_id, table.sdg_id),
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

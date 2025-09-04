import { pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Activity types table
export const activityTypes = pgTable('activity_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// Educational areas table
export const educationalAreas = pgTable('educational_areas', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon').notNull(),
  code: text('code').notNull().unique(),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// Educational goals table
export const educationalGoals = pgTable('educational_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  area_id: uuid('area_id').notNull().references(() => educationalAreas.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  code: text('code').notNull().unique(),
  icon: text('icon').notNull().default('🎯'),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// SDGs table
export const sdgs = pgTable('sdgs', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: integer('number').notNull().unique(), // 1-17
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon_url: text('icon_url').notNull(),
  icon: text('icon').notNull().default('🌱'),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// Group sizes table
export const groupSizes = pgTable('group_sizes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// Effort levels table
export const effortLevels = pgTable('effort_levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// Locations table
export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// Age groups table
export const ageGroups = pgTable('age_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// Zod schemas for validation
export const insertActivityTypeSchema = createInsertSchema(activityTypes);
export const selectActivityTypeSchema = createSelectSchema(activityTypes);

export const insertEducationalAreaSchema = createInsertSchema(educationalAreas);
export const selectEducationalAreaSchema = createSelectSchema(educationalAreas);

export const insertEducationalGoalSchema = createInsertSchema(educationalGoals);
export const selectEducationalGoalSchema = createSelectSchema(educationalGoals);

export const insertSdgSchema = createInsertSchema(sdgs);
export const selectSdgSchema = createSelectSchema(sdgs);

export const insertGroupSizeSchema = createInsertSchema(groupSizes);
export const selectGroupSizeSchema = createSelectSchema(groupSizes);

export const insertEffortLevelSchema = createInsertSchema(effortLevels);
export const selectEffortLevelSchema = createSelectSchema(effortLevels);

export const insertLocationSchema = createInsertSchema(locations);
export const selectLocationSchema = createSelectSchema(locations);

export const insertAgeGroupSchema = createInsertSchema(ageGroups);
export const selectAgeGroupSchema = createSelectSchema(ageGroups);

// TypeScript types
export type ActivityType = z.infer<typeof selectActivityTypeSchema>;
export type NewActivityType = z.infer<typeof insertActivityTypeSchema>;
export type EducationalArea = z.infer<typeof selectEducationalAreaSchema>;
export type NewEducationalArea = z.infer<typeof insertEducationalAreaSchema>;
export type EducationalGoal = z.infer<typeof selectEducationalGoalSchema>;
export type NewEducationalGoal = z.infer<typeof insertEducationalGoalSchema>;
export type Sdg = z.infer<typeof selectSdgSchema>;
export type NewSdg = z.infer<typeof insertSdgSchema>;
export type GroupSize = z.infer<typeof selectGroupSizeSchema>;
export type NewGroupSize = z.infer<typeof insertGroupSizeSchema>;
export type EffortLevel = z.infer<typeof selectEffortLevelSchema>;
export type NewEffortLevel = z.infer<typeof insertEffortLevelSchema>;
export type Location = z.infer<typeof selectLocationSchema>;
export type NewLocation = z.infer<typeof insertLocationSchema>;
export type AgeGroup = z.infer<typeof selectAgeGroupSchema>;
export type NewAgeGroup = z.infer<typeof insertAgeGroupSchema>;

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
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// SDGs table
export const sdgs = pgTable('sdgs', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: integer('number').notNull().unique(), // 1-17
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon_url: text('icon_url').notNull(),
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

// TypeScript types
export type ActivityType = z.infer<typeof selectActivityTypeSchema>;
export type NewActivityType = z.infer<typeof insertActivityTypeSchema>;
export type EducationalArea = z.infer<typeof selectEducationalAreaSchema>;
export type NewEducationalArea = z.infer<typeof insertEducationalAreaSchema>;
export type EducationalGoal = z.infer<typeof selectEducationalGoalSchema>;
export type NewEducationalGoal = z.infer<typeof insertEducationalGoalSchema>;
export type Sdg = z.infer<typeof selectSdgSchema>;
export type NewSdg = z.infer<typeof insertSdgSchema>;

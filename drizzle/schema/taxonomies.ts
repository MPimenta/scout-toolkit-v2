import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid, integer, boolean, primaryKey, index } from 'drizzle-orm/pg-core';
import { AGE_GROUP_VALUES } from './category-values';
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
  position: integer('position').notNull().default(0),
  // Rows written by the reference-data loader (the Matriz) are managed: read-only for admins.
  is_managed: boolean('is_managed').notNull().default(false),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// Educational paths (Caminhos Educativos): the level between an area and its general objectives
export const educationalPaths = pgTable('educational_paths', {
  id: uuid('id').primaryKey().defaultRandom(),
  area_id: uuid('area_id').notNull().references(() => educationalAreas.id, { onDelete: 'cascade' }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  position: integer('position').notNull().default(0),
  is_managed: boolean('is_managed').notNull().default(false),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// General objectives (Objetivos Educativos Gerais), one per area/number, e.g. "4F"
export const generalObjectives = pgTable('general_objectives', {
  id: uuid('id').primaryKey().defaultRandom(),
  area_id: uuid('area_id').notNull().references(() => educationalAreas.id, { onDelete: 'cascade' }),
  path_id: uuid('path_id').references(() => educationalPaths.id, { onDelete: 'set null' }),
  code: text('code').notNull().unique(),
  title: text('title').notNull(),
  position: integer('position').notNull().default(0),
  is_managed: boolean('is_managed').notNull().default(false),
  created_at: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  areaIdx: index('general_objectives_area_idx').on(table.area_id),
}));

// Educational goals table (the specific objectives of the Matriz, e.g. "4F.1.1")
export const educationalGoals = pgTable('educational_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  area_id: uuid('area_id').notNull().references(() => educationalAreas.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  code: text('code').notNull().unique(),
  icon: text('icon').notNull().default('🎯'),
  // Nullable so older admin-created goals survive; the API requires it for new goals.
  general_objective_id: uuid('general_objective_id').references(() => generalObjectives.id, { onDelete: 'set null' }),
  position: integer('position').notNull().default(0),
  is_managed: boolean('is_managed').notNull().default(false),
  created_at: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  generalObjectiveIdx: index('educational_goals_general_objective_idx').on(table.general_objective_id),
}));

// Age groups each goal belongs to (a "3-4" objective has two rows)
export const educationalGoalAgeGroups = pgTable('educational_goal_age_groups', {
  goal_id: uuid('goal_id').notNull().references(() => educationalGoals.id, { onDelete: 'cascade' }),
  age_group: text('age_group', { enum: AGE_GROUP_VALUES }).notNull(),
}, (table) => ({
  pk: primaryKey(table.goal_id, table.age_group),
  valueIdx: index('educational_goal_age_groups_value_idx').on(table.age_group),
}));

// Challenge types and challenges (desafios) of the Matriz, linked to the goals they serve
export const challengeTypes = pgTable('challenge_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  position: integer('position').notNull().default(0),
  is_managed: boolean('is_managed').notNull().default(false),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

export const challenges = pgTable('challenges', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  type_id: uuid('type_id').notNull().references(() => challengeTypes.id, { onDelete: 'cascade' }),
  age_group: text('age_group', { enum: AGE_GROUP_VALUES }).notNull(),
  position: integer('position').notNull().default(0),
  title: text('title').notNull(),
  // Short title from the reference sheet, for lists and pills (the full text stays in `title`).
  short_title: text('short_title'),
  // Divisions for which completing this desafio is mandatory for the first stage (integração).
  integration_age_groups: text('integration_age_groups', { enum: AGE_GROUP_VALUES }).array().notNull().default(sql`'{}'::text[]`),
  is_managed: boolean('is_managed').notNull().default(false),
  created_at: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  typeIdx: index('challenges_type_idx').on(table.type_id),
  ageGroupIdx: index('challenges_age_group_idx').on(table.age_group),
}));

export const challengeGoals = pgTable('challenge_goals', {
  challenge_id: uuid('challenge_id').notNull().references(() => challenges.id, { onDelete: 'cascade' }),
  goal_id: uuid('goal_id').notNull().references(() => educationalGoals.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey(table.challenge_id, table.goal_id),
  goalIdx: index('challenge_goals_goal_idx').on(table.goal_id),
}));

// Sources of activities (where an activity comes from, with licence terms)
export const activitySources = pgTable('activity_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  url: text('url'),
  license: text('license'),
  access: text('access'),
  language: text('language'),
  // Reading priority from the reference sheet (1 is the most important); null when not rated.
  priority: integer('priority'),
  is_managed: boolean('is_managed').notNull().default(false),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// Format (what kind of activity it is) and focus (what it develops), from the reference sheet.
export const activityFormats = pgTable('activity_formats', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  position: integer('position').notNull().default(0),
  is_managed: boolean('is_managed').notNull().default(false),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

export const activityFocuses = pgTable('activity_focuses', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  position: integer('position').notNull().default(0),
  is_managed: boolean('is_managed').notNull().default(false),
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
export type EducationalPath = typeof educationalPaths.$inferSelect;
export type GeneralObjective = typeof generalObjectives.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type ChallengeType = typeof challengeTypes.$inferSelect;
export type ActivitySource = typeof activitySources.$inferSelect;
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

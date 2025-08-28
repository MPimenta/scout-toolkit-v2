import { pgTable, text, timestamp, uuid, integer, boolean, date, time } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';
import { activities } from './activities';

// Programs table
export const programs = pgTable('programs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  date: date('date'),
  start_time: time('start_time').notNull(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  is_public: boolean('is_public').notNull().default(false),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// Program entries table
export const programEntries = pgTable('program_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  program_id: uuid('program_id').notNull().references(() => programs.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  start_time: time('start_time').notNull(),
  end_time: time('end_time').notNull(),
  entry_type: text('entry_type', { enum: ['activity', 'custom'] }).notNull(),
  activity_id: uuid('activity_id').references(() => activities.id, { onDelete: 'set null' }),
  custom_title: text('custom_title'),
  custom_duration_minutes: integer('custom_duration_minutes'),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// Zod schemas for validation
export const insertProgramSchema = createInsertSchema(programs);
export const selectProgramSchema = createSelectSchema(programs);

export const insertProgramEntrySchema = createInsertSchema(programEntries);
export const selectProgramEntrySchema = createSelectSchema(programEntries);

// TypeScript types
export type Program = z.infer<typeof selectProgramSchema>;
export type NewProgram = z.infer<typeof insertProgramSchema>;
export type ProgramEntry = z.infer<typeof selectProgramEntrySchema>;
export type NewProgramEntry = z.infer<typeof insertProgramEntrySchema>;

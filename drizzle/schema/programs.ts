import { pgTable, text, timestamp, uuid, integer, boolean, date, time, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { user } from './auth';
import { activities } from './activities';

// Programs table
export const programs = pgTable('programs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  date: date('date'),
  start_time: time('start_time').notNull(),
  user_id: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  is_public: boolean('is_public').notNull().default(false),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Performance indexes for frequently queried fields
  userIdIdx: index('programs_user_id_idx').on(table.user_id),
  dateIdx: index('programs_date_idx').on(table.date),
  createdAtIdx: index('programs_created_at_idx').on(table.created_at),
  // Composite index for user's programs with sorting
  userCreatedIdx: index('programs_user_created_idx').on(table.user_id, table.created_at),
}));

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
}, (table) => ({
  // Performance indexes for frequently queried fields
  programIdIdx: index('program_entries_program_id_idx').on(table.program_id),
  positionIdx: index('program_entries_position_idx').on(table.program_id, table.position),
  activityIdIdx: index('program_entries_activity_id_idx').on(table.activity_id),
}));

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

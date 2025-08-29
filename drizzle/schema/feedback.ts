import { pgTable, text, timestamp, uuid, integer, primaryKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';
import { activities } from './activities';

// Reviews table
export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom(),
  activity_id: uuid('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Ensure one review per user per activity
  uniqueReview: primaryKey(table.activity_id, table.user_id),
}));

// Edit suggestions table
export const editSuggestions = pgTable('edit_suggestions', {
  id: uuid('id').primaryKey().defaultRandom(),
  activity_id: uuid('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  field: text('field').notNull(), // e.g., 'name', 'description', 'materials'
  suggested_value: text('suggested_value').notNull(), // JSONB for multilingual content
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  reviewed_at: timestamp('reviewed_at'),
  reviewed_by: uuid('reviewed_by').references(() => users.id),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// Zod schemas for validation
export const insertReviewSchema = createInsertSchema(reviews);
export const selectReviewSchema = createSelectSchema(reviews);

export const insertEditSuggestionSchema = createInsertSchema(editSuggestions);
export const selectEditSuggestionSchema = createSelectSchema(editSuggestions);

// TypeScript types
export type Review = z.infer<typeof selectReviewSchema>;
export type NewReview = z.infer<typeof insertReviewSchema>;
export type EditSuggestion = z.infer<typeof selectEditSuggestionSchema>;
export type NewEditSuggestion = z.infer<typeof insertEditSuggestionSchema>;

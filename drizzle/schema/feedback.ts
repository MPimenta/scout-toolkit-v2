import { pgTable, text, timestamp, uuid, integer, primaryKey } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { activities } from './activities';
import { user } from './auth';

export const REACTION_KEYS = ['gosto', 'adorei', 'haha', 'wow', 'triste'] as const;
export const VOTE_VALUES = ['up', 'down'] as const;

// Reviews table
export const reviews = pgTable('reviews', {
  id: uuid('id').notNull().defaultRandom().unique(),
  activity_id: uuid('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Ensure one review per user per activity
  uniqueReview: primaryKey(table.activity_id, table.user_id),
}));

export const reviewVotes = pgTable('review_votes', {
  review_id: uuid('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  value: text('value', { enum: VOTE_VALUES }).notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey(table.review_id, table.user_id),
}));

export const reviewReactions = pgTable('review_reactions', {
  review_id: uuid('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  key: text('key', { enum: REACTION_KEYS }).notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey(table.review_id, table.user_id),
}));

export const reviewReplies = pgTable('review_replies', {
  id: uuid('id').primaryKey().defaultRandom(),
  review_id: uuid('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  mention_user_id: uuid('mention_user_id').references(() => user.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

export const replyReactions = pgTable('reply_reactions', {
  reply_id: uuid('reply_id').notNull().references(() => reviewReplies.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  key: text('key', { enum: REACTION_KEYS }).notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey(table.reply_id, table.user_id),
}));

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  href: text('href'),
  read_at: timestamp('read_at'),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

export const ISSUE_REPORT_KINDS = ['incidente', 'conteudo', 'ideia'] as const;
export const ISSUE_REPORT_STATUSES = ['aberto', 'fechado'] as const;

export const issueReports = pgTable('issue_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: text('kind', { enum: ISSUE_REPORT_KINDS }).notNull(),
  message: text('message').notNull(),
  contact_email: text('contact_email'),
  path: text('path').notNull(),
  locale: text('locale').notNull(),
  viewport: text('viewport').notNull(),
  user_id: uuid('user_id').references(() => user.id, { onDelete: 'set null' }),
  status: text('status', { enum: ISSUE_REPORT_STATUSES }).notNull().default('aberto'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  closed_at: timestamp('closed_at'),
  closed_by: uuid('closed_by').references(() => user.id, { onDelete: 'set null' }),
});

// Edit suggestions table
export const editSuggestions = pgTable('edit_suggestions', {
  id: uuid('id').primaryKey().defaultRandom(),
  activity_id: uuid('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  field: text('field').notNull(), // e.g., 'name', 'description', 'materials'
  suggested_value: text('suggested_value').notNull(),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  reviewed_at: timestamp('reviewed_at'),
  reviewed_by: uuid('reviewed_by').references(() => user.id),
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

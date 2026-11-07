import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { activities } from './activities';
import { user } from './auth';
import { programs } from './programs';

export const USAGE_EVENT_TYPES = ['search', 'activity_view', 'program_add'] as const;
export type UsageEventType = (typeof USAGE_EVENT_TYPES)[number];

/**
 * Usage tracking (openspec: usage-tracking). One row per event. Only the visitor id and, when
 * signed in, the user id identify anyone: no IP address, user-agent or referrer is stored.
 * Rows older than 13 months are purged.
 */
export const usageEvents = pgTable(
  'usage_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: text('type', { enum: USAGE_EVENT_TYPES }).notNull(),
    occurred_at: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
    visitor_id: uuid('visitor_id').notNull(),
    user_id: uuid('user_id').references(() => user.id, { onDelete: 'set null' }),
    activity_id: uuid('activity_id').references(() => activities.id, { onDelete: 'cascade' }),
    program_id: uuid('program_id').references(() => programs.id, { onDelete: 'set null' }),
    /** search: { text, filters, divisions, result_count } */
    payload: jsonb('payload').$type<Record<string, unknown>>(),
  },
  (table) => [
    index('usage_events_type_time_idx').on(table.type, table.occurred_at),
    index('usage_events_activity_idx').on(table.activity_id, table.type, table.occurred_at),
    index('usage_events_visitor_idx').on(table.visitor_id, table.occurred_at),
    index('usage_events_user_idx').on(table.user_id, table.occurred_at),
  ]
);

export type UsageEvent = typeof usageEvents.$inferSelect;
export type NewUsageEvent = typeof usageEvents.$inferInsert;

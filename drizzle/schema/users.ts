import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  image: text('image'),
  role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// User roles table (for future role expansion)
export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'admin'] }).notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertUserRoleSchema = createInsertSchema(userRoles);
export const selectUserRoleSchema = createSelectSchema(userRoles);

// TypeScript types
export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
export type UserRole = z.infer<typeof selectUserRoleSchema>;
export type NewUserRole = z.infer<typeof insertUserRoleSchema>;

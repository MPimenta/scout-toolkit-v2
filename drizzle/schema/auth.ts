import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// NextAuth.js v5 required tables for DrizzleAdapter
// These table names and structures are fixed by NextAuth.js

// User table - NextAuth.js expects 'user' (singular), not 'users'
export const user = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified'),
  image: text('image'),
});

// Accounts table - stores OAuth provider accounts
export const account = pgTable('account', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: text('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
});

// Sessions table - stores user sessions
export const session = pgTable('session', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionToken: text('sessionToken').notNull().unique(),
  userId: uuid('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
});

// Verification tokens table - stores email verification tokens
export const verificationToken = pgTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires').notNull(),
});

// Add indexes for better performance
export const accountIndexes = [
  { name: 'account_provider_providerAccountId_idx', columns: ['provider', 'providerAccountId'] },
  { name: 'account_userId_idx', columns: ['userId'] },
];

export const sessionIndexes = [
  { name: 'session_sessionToken_idx', columns: ['sessionToken'] },
  { name: 'session_userId_idx', columns: ['userId'] },
];

export const verificationTokenIndexes = [
  { name: 'verificationToken_identifier_token_idx', columns: ['identifier', 'token'] },
];

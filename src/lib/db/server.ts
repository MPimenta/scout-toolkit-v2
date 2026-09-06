import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as schema from '../../../drizzle/schema';

// Load environment variables for server-side operations
dotenv.config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env.local',
  override: false,
});

// Database connection for server-side operations only
const connectionString = process.env['DATABASE_URL']!;
export const client = postgres(connectionString, { max: 1 });
export const db = drizzle(client, { schema });

export { db as default };


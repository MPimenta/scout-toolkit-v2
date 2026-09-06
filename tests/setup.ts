process.env.DATABASE_URL =
  'postgresql://test_user:test_password@localhost:5432/scout_toolkit_test'

import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../drizzle/schema'
import { probeLocalTestDatabase } from './helpers/local-test-db'

process.env.SCOUT_HAS_LOCAL_TEST_DB = (await probeLocalTestDatabase()) ? '1' : ''

let testDb: ReturnType<typeof drizzle>
export let sql: ReturnType<typeof postgres>

export async function setupTestDatabase() {
  try {
    // Use test database connection string
    const connectionString = 'postgresql://test_user:test_password@localhost:5432/scout_toolkit_test'
    
    // Create postgres connection
    sql = postgres(connectionString, { max: 1 })
    
    // Create Drizzle instance
    testDb = drizzle(sql, { schema })
    const { boundTestDb } = await import('./helpers/bound-test-db')
    boundTestDb.current = testDb
    
    // Create tables if they don't exist (avoids permission issues)
    await createTestSchema()
    
    console.log('Test database setup completed successfully')
    
    return testDb
  } catch (error) {
    console.error('Failed to setup test database:', error)
    throw error
  }
}

async function createTestSchema() {
  try {
    // Instead of dropping schema, just create tables if they don't exist
    // This avoids permission issues and is more efficient
    
    // User table (NextAuth.js)
    await sql`
      CREATE TABLE IF NOT EXISTS "user" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text,
        email text NOT NULL UNIQUE,
        "emailVerified" timestamp,
        image text,
        role text NOT NULL DEFAULT 'user'
      )
    `;

    await sql`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'`;

    // Account table (NextAuth.js)
    await sql`
      CREATE TABLE IF NOT EXISTS account (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        type text NOT NULL,
        provider text NOT NULL,
        "providerAccountId" text NOT NULL,
        refresh_token text,
        access_token text,
        expires_at text,
        token_type text,
        scope text,
        id_token text,
        session_state text
      )
    `;

    // Session table (NextAuth.js)
    await sql`
      CREATE TABLE IF NOT EXISTS session (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "sessionToken" text NOT NULL UNIQUE,
        "userId" uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        expires timestamp NOT NULL
      )
    `;

    // Verification token table (NextAuth.js)
    await sql`
      CREATE TABLE IF NOT EXISTS "verificationToken" (
        identifier text NOT NULL,
        token text NOT NULL UNIQUE,
        expires timestamp NOT NULL
      )
    `;

    // SDGs table
    await sql`
      CREATE TABLE IF NOT EXISTS sdgs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        number integer NOT NULL UNIQUE,
        name text NOT NULL,
        description text,
        icon_url text,
        created_at timestamp DEFAULT now()
      )
    `;

    // Educational areas table
    await sql`
      CREATE TABLE IF NOT EXISTS educational_areas (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL UNIQUE,
        description text,
        icon text NOT NULL,
        code text NOT NULL UNIQUE,
        created_at timestamp DEFAULT now()
      )
    `;

    // Educational goals table
    await sql`
      CREATE TABLE IF NOT EXISTS educational_goals (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        description text,
        code text NOT NULL UNIQUE,
        area_id uuid REFERENCES educational_areas(id),
        created_at timestamp DEFAULT now()
      )
    `;

    // Activity types table
    await sql`
      CREATE TABLE IF NOT EXISTS activity_types (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        description text,
        created_at timestamp DEFAULT now()
      )
    `;

    // Activities table
    await sql`
      CREATE TABLE IF NOT EXISTS activities (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        description text NOT NULL,
        materials text NOT NULL,
        approximate_duration_minutes integer NOT NULL,
        group_size text NOT NULL,
        effort_level text NOT NULL,
        location text NOT NULL,
        age_group text NOT NULL,
        activity_type_id uuid REFERENCES activity_types(id),
        image_url text,
        created_by uuid REFERENCES "user"(id),
        is_approved boolean DEFAULT true,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      )
    `;

    // Activity SDGs junction table
    await sql`
      CREATE TABLE IF NOT EXISTS activity_sdgs (
        activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
        sdg_id uuid REFERENCES sdgs(id) ON DELETE CASCADE,
        PRIMARY KEY (activity_id, sdg_id)
      )
    `;

    // Activity educational goals junction table
    await sql`
      CREATE TABLE IF NOT EXISTS activity_educational_goals (
        activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
        goal_id uuid REFERENCES educational_goals(id) ON DELETE CASCADE,
        PRIMARY KEY (activity_id, goal_id)
      )
    `;

    // Programs table
    await sql`
      CREATE TABLE IF NOT EXISTS programs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        date date,
        start_time time NOT NULL,
        user_id uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        is_public boolean NOT NULL DEFAULT false,
        source_program_id uuid,
        source_author_name text,
        orgo_event_uuid text,
        orgo_event_url text,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      )
    `;

    await sql`ALTER TABLE programs ADD COLUMN IF NOT EXISTS source_program_id uuid`;
    await sql`ALTER TABLE programs ADD COLUMN IF NOT EXISTS source_author_name text`;
    await sql`ALTER TABLE programs ADD COLUMN IF NOT EXISTS orgo_event_uuid text`;
    await sql`ALTER TABLE programs ADD COLUMN IF NOT EXISTS orgo_event_url text`;

    // Program entries table
    await sql`
      CREATE TABLE IF NOT EXISTS program_entries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        program_id uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
        position integer NOT NULL,
        start_time time NOT NULL,
        end_time time NOT NULL,
        entry_type text NOT NULL CHECK (entry_type IN ('activity', 'custom')),
        activity_id uuid REFERENCES activities(id) ON DELETE SET NULL,
        custom_title text,
        custom_duration_minutes integer,
        created_at timestamp DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id uuid UNIQUE DEFAULT gen_random_uuid(),
        activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        rating integer NOT NULL,
        comment text,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now(),
        PRIMARY KEY (activity_id, user_id)
      )
    `;

    await sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid()`;
    await sql`UPDATE reviews SET id = gen_random_uuid() WHERE id IS NULL`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS reviews_id_unique ON reviews(id)`;

    await sql`
      CREATE TABLE IF NOT EXISTS review_votes (
        review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        value text NOT NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        PRIMARY KEY (review_id, user_id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS review_reactions (
        review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        key text NOT NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        PRIMARY KEY (review_id, user_id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS review_replies (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        body text NOT NULL,
        mention_user_id uuid REFERENCES "user"(id) ON DELETE SET NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS edit_suggestions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        field text NOT NULL,
        suggested_value text NOT NULL,
        status text NOT NULL DEFAULT 'pending',
        reviewed_at timestamp,
        reviewed_by uuid REFERENCES "user"(id),
        created_at timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        type text NOT NULL,
        title text NOT NULL,
        body text NOT NULL,
        href text,
        read_at timestamp,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS reply_reactions (
        reply_id uuid NOT NULL REFERENCES review_replies(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        key text NOT NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        PRIMARY KEY (reply_id, user_id)
      )
    `;

    console.log('Test schema created successfully')
  } catch (error) {
    console.error('Failed to create test schema:', error)
    throw error
  }
}

export async function teardownTestDatabase() {
  try {
    if (sql) {
      await sql.end()
    }
  } catch (error) {
    console.warn('Failed to teardown test database:', error)
  }
}

export async function resetTestDatabase() {
  try {
    if (testDb && sql) {
      // Truncate all tables in reverse dependency order using raw SQL
      const tables = [
        'reply_reactions',
        'review_replies',
        'review_reactions',
        'review_votes',
        'notifications',
        'edit_suggestions',
        'reviews',
        'program_entries',
        'programs', 
        'activity_sdgs',
        'activity_educational_goals',
        'activities',
        'activity_types',
        'educational_goals',
        'educational_areas',
        'sdgs',
        'verificationToken',
        'session',
        'account',
        'user'
      ]
      
      for (const table of tables) {
        try {
          await sql`TRUNCATE TABLE ${sql(table)} CASCADE`
        } catch (error) {
          // Ignore errors for tables that don't exist
          console.warn(`Could not truncate table ${table}:`, error)
        }
      }
    }
  } catch (error) {
    console.warn('Failed to reset test database:', error)
  }
}

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

// Mock environment variables
vi.mock('process', () => ({
  env: {
    DATABASE_URL: 'postgresql://test_user:test_password@localhost:5432/scout_toolkit_test',
    NEXTAUTH_SECRET: 'test-secret',
    ORGO_ISSUER: 'https://eaep.escoteiros.pt',
    ORGO_CLIENT_ID: 'test-client-id',
    ORGO_CLIENT_SECRET: 'test-client-secret',
  },
}))

// Mock ResizeObserver for UI components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

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

    // The activity types are gone (format-focus-everywhere): drop the tables an older run left in this test database.
    await sql`DROP TABLE IF EXISTS activity_activity_types`;
    await sql`DROP TABLE IF EXISTS activity_types`;

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

    // Activities table
    await sql`
      CREATE TABLE IF NOT EXISTS activities (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        description text NOT NULL,
        materials text NOT NULL,
        approximate_duration_minutes integer NOT NULL,
        effort_level text NOT NULL,
        image_url text,
        created_by uuid REFERENCES "user"(id),
        is_approved boolean DEFAULT true,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      )
    `;

    // Single-valued category columns were replaced by the link tables below.
    await sql`ALTER TABLE activities DROP COLUMN IF EXISTS group_size`;
    await sql`ALTER TABLE activities DROP COLUMN IF EXISTS location`;
    await sql`ALTER TABLE activities DROP COLUMN IF EXISTS age_group`;
    await sql`ALTER TABLE activities DROP COLUMN IF EXISTS activity_type_id`;

    // Multi-valued category link tables
    await sql`
      CREATE TABLE IF NOT EXISTS activity_group_sizes (
        activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
        group_size text NOT NULL,
        PRIMARY KEY (activity_id, group_size)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS activity_locations (
        activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
        location text NOT NULL,
        PRIMARY KEY (activity_id, location)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS activity_age_groups (
        activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
        age_group text NOT NULL,
        PRIMARY KEY (activity_id, age_group)
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
        age_group text NOT NULL,
        observable_behaviour text,
        PRIMARY KEY (activity_id, goal_id, age_group)
      )
    `;
    // Older test databases have the two-column key: move them to the per-division shape.
    await sql`ALTER TABLE activity_educational_goals ADD COLUMN IF NOT EXISTS age_group text`;
    await sql`ALTER TABLE activity_educational_goals ADD COLUMN IF NOT EXISTS observable_behaviour text`;
    await sql.unsafe(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'activity_educational_goals_pkey'
            AND conrelid = 'activity_educational_goals'::regclass
            AND array_length(conkey, 1) = 2
        ) THEN
          ALTER TABLE activity_educational_goals DROP CONSTRAINT activity_educational_goals_pkey;
          DELETE FROM activity_educational_goals WHERE age_group IS NULL;
          ALTER TABLE activity_educational_goals ALTER COLUMN age_group SET NOT NULL;
          ALTER TABLE activity_educational_goals ADD PRIMARY KEY (activity_id, goal_id, age_group);
        END IF;
      END $$
    `);

    // Sources, risk analysis, SDG justification and desafios of activities
    await sql`
      CREATE TABLE IF NOT EXISTS activity_sources (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code text NOT NULL UNIQUE,
        name text NOT NULL,
        url text,
        license text,
        access text,
        language text,
        is_managed boolean NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `;
    for (const column of [
      'physical_risk_level text',
      'physical_risk text',
      'physical_mitigation text',
      'psychological_risk_level text',
      'psychological_risk text',
      'psychological_mitigation text',
      'source_url text',
    ]) {
      await sql.unsafe(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS ${column}`);
    }
    await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS source_id uuid REFERENCES activity_sources(id) ON DELETE SET NULL`;
    await sql`ALTER TABLE activity_sources ADD COLUMN IF NOT EXISTS priority integer`;

    // Formats and focuses (reference sheet), the duration range and the sheet id of activities
    for (const table of ['activity_formats', 'activity_focuses']) {
      await sql.unsafe(`
        CREATE TABLE IF NOT EXISTS ${table} (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          code text NOT NULL UNIQUE,
          name text NOT NULL,
          description text,
          position integer NOT NULL DEFAULT 0,
          is_managed boolean NOT NULL DEFAULT false,
          created_at timestamp NOT NULL DEFAULT now()
        )
      `);
    }
    for (const column of [
      'duration_min_minutes integer',
      'duration_max_minutes integer',
      'external_id text',
      'external_hash text',
      'format_id uuid REFERENCES activity_formats(id) ON DELETE RESTRICT',
      'focus_id uuid REFERENCES activity_focuses(id) ON DELETE RESTRICT',
      'secondary_focus_id uuid REFERENCES activity_focuses(id) ON DELETE RESTRICT',
    ]) {
      await sql.unsafe(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS ${column}`);
    }
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS activities_external_id_unique ON activities (external_id)`;
    await sql`ALTER TABLE activity_sdgs ADD COLUMN IF NOT EXISTS justification text`;

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
    // Columns the app schema has that this hand-written test schema lacked.
    await sql`ALTER TABLE sdgs ADD COLUMN IF NOT EXISTS icon text`;
    await sql`ALTER TABLE educational_goals ADD COLUMN IF NOT EXISTS icon text`;

    // Matriz Progresso Pessoal tables (mirrors drizzle/schema/taxonomies.ts)
    await sql`ALTER TABLE educational_areas ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0`;
    await sql`ALTER TABLE educational_areas ADD COLUMN IF NOT EXISTS is_managed boolean NOT NULL DEFAULT false`;
    await sql`
      CREATE TABLE IF NOT EXISTS educational_paths (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        area_id uuid NOT NULL REFERENCES educational_areas(id) ON DELETE CASCADE,
        code text NOT NULL UNIQUE,
        name text NOT NULL,
        position integer NOT NULL DEFAULT 0,
        is_managed boolean NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS general_objectives (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        area_id uuid NOT NULL REFERENCES educational_areas(id) ON DELETE CASCADE,
        path_id uuid REFERENCES educational_paths(id) ON DELETE SET NULL,
        code text NOT NULL UNIQUE,
        title text NOT NULL,
        position integer NOT NULL DEFAULT 0,
        is_managed boolean NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `;
    await sql`ALTER TABLE educational_goals ADD COLUMN IF NOT EXISTS general_objective_id uuid REFERENCES general_objectives(id) ON DELETE SET NULL`;
    await sql`ALTER TABLE educational_goals ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0`;
    await sql`ALTER TABLE educational_goals ADD COLUMN IF NOT EXISTS is_managed boolean NOT NULL DEFAULT false`;
    await sql`
      CREATE TABLE IF NOT EXISTS educational_goal_age_groups (
        goal_id uuid NOT NULL REFERENCES educational_goals(id) ON DELETE CASCADE,
        age_group text NOT NULL,
        PRIMARY KEY (goal_id, age_group)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS challenge_types (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code text NOT NULL UNIQUE,
        name text NOT NULL,
        position integer NOT NULL DEFAULT 0,
        is_managed boolean NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS challenges (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code text NOT NULL UNIQUE,
        type_id uuid NOT NULL REFERENCES challenge_types(id) ON DELETE CASCADE,
        age_group text NOT NULL,
        position integer NOT NULL DEFAULT 0,
        title text NOT NULL,
        is_managed boolean NOT NULL DEFAULT false,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `;
    await sql`ALTER TABLE challenges ADD COLUMN IF NOT EXISTS short_title text`;
    await sql`ALTER TABLE challenges ADD COLUMN IF NOT EXISTS integration_age_groups text[] NOT NULL DEFAULT '{}'`;
    await sql`
      CREATE TABLE IF NOT EXISTS challenge_goals (
        challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
        goal_id uuid NOT NULL REFERENCES educational_goals(id) ON DELETE CASCADE,
        PRIMARY KEY (challenge_id, goal_id)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS activity_challenges (
        activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
        challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
        PRIMARY KEY (activity_id, challenge_id)
      )
    `;

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

    await sql`
      CREATE TABLE IF NOT EXISTS issue_reports (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        kind text NOT NULL,
        message text NOT NULL,
        contact_email text,
        path text NOT NULL,
        locale text NOT NULL,
        viewport text NOT NULL,
        user_id uuid REFERENCES "user"(id) ON DELETE SET NULL,
        status text NOT NULL DEFAULT 'aberto',
        created_at timestamp NOT NULL DEFAULT now(),
        closed_at timestamp,
        closed_by uuid REFERENCES "user"(id) ON DELETE SET NULL
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS usage_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        type text NOT NULL,
        occurred_at timestamptz NOT NULL DEFAULT now(),
        visitor_id uuid NOT NULL,
        user_id uuid REFERENCES "user"(id) ON DELETE SET NULL,
        activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
        program_id uuid REFERENCES programs(id) ON DELETE SET NULL,
        payload jsonb
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
        'usage_events',
        'issue_reports',
        'review_replies',
        'review_reactions',
        'review_votes',
        'notifications',
        'edit_suggestions',
        'reviews',
        'program_entries',
        'programs', 
        'activity_sdgs',
        'activity_challenges',
        'activity_educational_goals',
        'activity_group_sizes',
        'activity_locations',
        'activity_age_groups',
        'activities',
        'activity_formats',
        'activity_focuses',
        'activity_sources',
        'challenge_goals',
        'challenges',
        'challenge_types',
        'educational_goal_age_groups',
        'educational_goals',
        'general_objectives',
        'educational_paths',
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

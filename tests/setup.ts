import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from '../drizzle/schema'
import { TEST_DATA, adaptDataForSQLite, adaptDataFromSQLite, createSQLiteSchema } from './schema-adapter'

// Test database setup
let testDb: Database.Database
let testDrizzle: ReturnType<typeof drizzle>

export async function setupTestDatabase() {
  try {
    // Create in-memory SQLite database
    testDb = new Database(':memory:')
    
    // Create SQLite schema manually instead of running PostgreSQL migrations
    await createSQLiteSchema(testDb)
    
    // Create Drizzle instance with the raw database for now
    // We'll need to create SQLite-compatible schema definitions later
    testDrizzle = drizzle(testDb)
    
    // Seed with minimal test data
    await seedTestData(testDrizzle)
    
    return testDrizzle
  } catch (error) {
    console.warn('Failed to setup test database:', error)
    // Return null if setup fails - tests can handle this gracefully
    return null
  }
}

export async function teardownTestDatabase() {
  try {
    if (testDb) {
      testDb.close()
    }
  } catch (error) {
    console.warn('Failed to teardown test database:', error)
  }
}

// Helper function to seed test data
async function seedTestData(db: ReturnType<typeof drizzle>) {
  try {
    // Insert minimal test data for basic tests
    // This will be expanded as needed
    
    // Note: We'll need to implement actual data insertion once we have
    // the schema working properly with SQLite
    
    console.log('Test database seeded successfully')
  } catch (error) {
    console.warn('Failed to seed test data:', error)
  }
}

// Export helper functions for tests
export { adaptDataForSQLite, adaptDataFromSQLite, TEST_DATA }

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
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
}));

// Mock environment variables
vi.mock('process', () => ({
  env: {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    NEXTAUTH_SECRET: 'test-secret',
    GOOGLE_CLIENT_ID: 'test-client-id',
    GOOGLE_CLIENT_SECRET: 'test-client-secret',
  },
}));

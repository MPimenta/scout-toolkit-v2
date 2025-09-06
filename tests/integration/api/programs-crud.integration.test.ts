import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import { programs, programEntries, user } from '../../../drizzle/schema/index';
import { eq } from 'drizzle-orm';
import { withTestDatabase, createTestUser, createTestActivity, createTestProgram } from '../../helpers/database';
import { sql } from 'drizzle-orm';
import { GET } from '../../../src/app/api/programs/[id]/route';
import { NextRequest } from 'next/server';

// Mock the auth function directly in the test file
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(() => {
    console.log('🔐 Auth mock called in test file - returning test user session');
    return {
      user: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@escoteiros.pt',
        name: 'Test User'
      }
    };
  })
}));

describe('Programs CRUD', () => {
  let db: ReturnType<typeof drizzle>;
  let cleanup: () => Promise<void>;
  let testUserId: string;

  beforeAll(async () => {
    const setup = await withTestDatabase();
    db = setup.db;
    cleanup = setup.cleanup;
    
    const [testUser] = await db.insert(user).values({
      id: '550e8400-e29b-41d4-a716-446655440000', // Proper UUID
      name: 'Test User',
      email: 'test@escoteiros.pt',
      image: 'https://example.com/test.jpg'
    }).returning();
    testUserId = testUser.id;
  });

  afterAll(async () => {
    await cleanup();
  });

  beforeEach(async () => {
    // Use the raw SQL connection for truncation
    const { sql: rawSql } = await import('../../setup');
    
    await rawSql`TRUNCATE TABLE programs CASCADE`;
    await rawSql`TRUNCATE TABLE program_entries CASCADE`;
    await rawSql`TRUNCATE TABLE "user" CASCADE`;
    
    // Recreate test user after truncate
    const [testUser] = await db.insert(user).values({
      id: '550e8400-e29b-41d4-a716-446655440000', // Proper UUID
      name: 'Test User',
      email: 'test@escoteiros.pt',
      image: 'https://example.com/test.jpg'
    }).returning();
    testUserId = testUser.id;
  });

  it('returns 404 for program owned by different user', async () => {
    // Create another user's program
    const [otherUser] = await db.insert(user).values({
      id: '550e8400-e29b-41d4-a716-446655440001', // Proper UUID
      name: 'Other User',
      email: 'other@escoteiros.pt',
      image: 'https://example.com/other.jpg'
    }).returning();

    const [otherProgram] = await db.insert(programs).values({
      name: 'Other Program',
      start_time: '11:00',
      is_public: false,
      user_id: otherUser.id
    }).returning();

    // Call the API route function directly instead of making HTTP request
    const mockRequest = new NextRequest(`http://localhost:3000/api/programs/${otherProgram.id}`);
    const response = await GET(mockRequest, { params: Promise.resolve({ id: otherProgram.id }) });

    // The API should return 404 because it only shows programs owned by the authenticated user
    expect(response.status).toBe(404);
  });
});

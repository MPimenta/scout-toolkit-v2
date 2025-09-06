import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import { POST } from '@/app/api/programs/[id]/entries/route';
import { NextRequest } from 'next/server';
import { withTestDatabase, createTestUser, createTestProgram, createTestActivity } from '../../helpers/database';
import { auth } from '@/lib/auth/config';
import { user, programs, activities, programEntries } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';

// Mock the auth function directly in the test file
vi.mock('@/lib/auth/config', () => ({
  auth: vi.fn(() => {
    console.log('🔐 Auth mock called in test file - returning test user session');
    return {
      user: {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'test-addtoprogram@escoteiros.pt',
        name: 'Test User AddToProgram'
      }
    };
  })
}));

describe('Add to Program Integration Tests', () => {
  let db: ReturnType<typeof drizzle>;
  let cleanup: () => Promise<void>;
  let testUserId: string;
  let testProgramId: string;
  let testActivityId: string;

  beforeAll(async () => {
    const setup = await withTestDatabase();
    db = setup.db;
    cleanup = setup.cleanup;
    
    // Create test user with unique email
    const [testUser] = await db.insert(user).values({
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Test User AddToProgram',
      email: 'test-addtoprogram@escoteiros.pt',
      image: 'https://example.com/test.jpg'
    }).returning();
    testUserId = testUser.id;

    // Create test program
    const [testProgram] = await db.insert(programs).values({
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Test Program',
      user_id: testUserId,
      date: '2024-01-01',
      start_time: '09:00',
      is_public: false,
    }).returning();
    testProgramId = testProgram.id;

    // Create test activity with proper UUID
    const { activity } = await createTestActivity(db);
    testActivityId = activity.id;

    // Auth is already mocked globally
  });

  afterAll(async () => {
    await cleanup();
  });

  beforeEach(async () => {
    // Clear program entries before each test
    await db.delete(programEntries).where(eq(programEntries.program_id, testProgramId));
  });

  describe('POST /api/programs/[id]/entries', () => {
    it('should add activity to program successfully', async () => {
      const requestBody = {
        entry_type: 'activity',
        activity_id: testActivityId,
        position: 1,
        start_time: '09:00',
        end_time: '09:30',
      };

      const request = new NextRequest(`http://localhost:3000/api/programs/${testProgramId}/entries`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request, { params: Promise.resolve({ id: testProgramId }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.entry).toBeDefined();
      expect(data.entry.entry_type).toBe('activity');
      expect(data.entry.activity_id).toBe(testActivityId);
      expect(data.entry.position).toBe(1);
      expect(data.entry.start_time).toBe('09:00:00');
      expect(data.entry.end_time).toBe('09:30:00');
    });

    it('should add custom block to program successfully', async () => {
      const requestBody = {
        entry_type: 'custom',
        custom_title: 'Break',
        custom_duration_minutes: 15,
        position: 1,
        start_time: '09:00',
        end_time: '09:15',
      };

      const request = new NextRequest(`http://localhost:3000/api/programs/${testProgramId}/entries`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request, { params: Promise.resolve({ id: testProgramId }) });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.entry).toBeDefined();
      expect(data.entry.entry_type).toBe('custom');
      expect(data.entry.custom_title).toBe('Break');
      expect(data.entry.custom_duration_minutes).toBe(15);
      expect(data.entry.position).toBe(1);
    });

    it('should return 401 for unauthenticated user', async () => {
      // Temporarily override the auth mock to return null
      vi.mocked(auth).mockReturnValueOnce(null as any);

      const requestBody = {
        entry_type: 'activity',
        activity_id: testActivityId,
        position: 1,
        start_time: '09:00',
        end_time: '09:30',
      };

      const request = new NextRequest(`http://localhost:3000/api/programs/${testProgramId}/entries`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request, { params: Promise.resolve({ id: testProgramId }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 for non-existent program', async () => {
      const requestBody = {
        entry_type: 'activity',
        activity_id: testActivityId,
        position: 1,
        start_time: '09:00',
        end_time: '09:30',
      };

      const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';
      const request = new NextRequest(`http://localhost:3000/api/programs/${nonExistentId}/entries`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request, { params: Promise.resolve({ id: nonExistentId }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Program not found or access denied');
    });

    it('should return 400 for missing required fields', async () => {
      const requestBody = {
        entry_type: 'activity',
        activity_id: testActivityId,
        // Missing position, start_time, end_time
      };

      const request = new NextRequest(`http://localhost:3000/api/programs/${testProgramId}/entries`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request, { params: Promise.resolve({ id: testProgramId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Position, start_time, end_time, and entry_type are required');
    });

    it('should return 404 for program owned by different user', async () => {
      // Create another user and program with unique email
      const uniqueEmail = `other-${Date.now()}@escoteiros.pt`;
      const [otherUser] = await db.insert(user).values({
        id: '550e8400-e29b-41d4-a716-446655440004',
        email: uniqueEmail,
        name: 'Other User',
        image: 'https://example.com/other.jpg'
      }).returning();

      const [otherProgram] = await db.insert(programs).values({
        id: '550e8400-e29b-41d4-a716-446655440005',
        name: 'Other Program',
        user_id: otherUser.id,
        date: '2024-01-01',
        start_time: '09:00',
        is_public: false,
      }).returning();

      const requestBody = {
        entry_type: 'activity',
        activity_id: testActivityId,
        position: 1,
        start_time: '09:00',
        end_time: '09:30',
      };

      const request = new NextRequest('http://localhost:3000/api/programs/other-program/entries', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request, { params: Promise.resolve({ id: otherProgram.id }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Program not found or access denied');
    });
  });
});

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/stats/route';
import { withTestDatabase } from '../../helpers/database';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { user } from '../../../drizzle/schema';

const mockAuth = vi.fn();
const mockCookie = vi.fn();

vi.mock('@/lib/auth/config', () => ({
  auth: () => mockAuth(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => mockCookie(name),
  }),
}));

const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440020';
const MEMBER_ID = '550e8400-e29b-41d4-a716-446655440021';

describe('Admin view-as on /api/admin/stats', () => {
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    requireLocalTestDatabase();
    const setup = await withTestDatabase();
    cleanup = setup.cleanup;
    await setup.db.insert(user).values([
      { id: ADMIN_ID, email: 'admin-viewas@escoteiros.pt', name: 'Admin', role: 'admin' },
      { id: MEMBER_ID, email: 'member-viewas@escoteiros.pt', name: 'Membro', role: 'user' },
    ]);
  });

  afterAll(async () => {
    if (cleanup) await cleanup();
  });

  beforeEach(() => {
    mockCookie.mockReturnValue(undefined);
  });

  it('returns 200 for an admin with the overlay off', async () => {
    mockAuth.mockResolvedValue({
      user: { id: ADMIN_ID, role: 'admin', email: 'admin-viewas@escoteiros.pt', name: 'Admin' },
    });
    const response = await GET(new NextRequest('http://localhost:3000/api/admin/stats'));
    expect(response.status).toBe(200);
  });

  it('returns 403 for an admin with member view on', async () => {
    mockAuth.mockResolvedValue({
      user: { id: ADMIN_ID, role: 'admin', email: 'admin-viewas@escoteiros.pt', name: 'Admin' },
    });
    mockCookie.mockImplementation((name: string) => (
      name === 'kit-view-as' ? { value: 'member' } : undefined
    ));
    const response = await GET(new NextRequest('http://localhost:3000/api/admin/stats'));
    expect(response.status).toBe(403);
  });

  it('returns 403 for a stored user even with a forged overlay', async () => {
    mockAuth.mockResolvedValue({
      user: { id: MEMBER_ID, role: 'user', email: 'member-viewas@escoteiros.pt', name: 'Membro' },
    });
    mockCookie.mockImplementation((name: string) => (
      name === 'kit-view-as' ? { value: 'admin' } : undefined
    ));
    const response = await GET(new NextRequest('http://localhost:3000/api/admin/stats'));
    expect(response.status).toBe(403);
  });
});

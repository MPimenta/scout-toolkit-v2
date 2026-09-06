import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.fn();
const mockRequireAdminApi = vi.fn();

vi.mock('@/lib/auth/config', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/auth/utils', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth/utils')>('@/lib/auth/utils');
  return {
    ...actual,
    requireAdminApi: () => mockRequireAdminApi(),
  };
});

vi.mock('@/lib/db/server', () => {
  const zeros = Promise.resolve([{ value: 0 }]);
  const chain = {
    where: () => zeros,
    then: zeros.then.bind(zeros),
    catch: zeros.catch.bind(zeros),
  };
  return {
    db: {
      select: () => ({
        from: () => chain,
      }),
    },
  };
});

function requestFor() {
  return new NextRequest('http://localhost:3000/api/admin/stats');
}

describe('Admin stats API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 for guests', async () => {
    const { apiErrors } = await import('@/lib/errors');
    mockRequireAdminApi.mockResolvedValue({ error: apiErrors.unauthorized() });
    const { GET } = await import('@/app/api/admin/stats/route');
    const response = await GET(requestFor());
    expect(response.status).toBe(401);
  });

  it('returns 403 for signed-in non-admins', async () => {
    const { apiErrors } = await import('@/lib/errors');
    mockRequireAdminApi.mockResolvedValue({ error: apiErrors.forbidden() });
    const { GET } = await import('@/app/api/admin/stats/route');
    const response = await GET(requestFor());
    expect(response.status).toBe(403);
  });

  it('returns zero counts for an admin', async () => {
    mockRequireAdminApi.mockResolvedValue({
      user: { id: 'admin-1', role: 'admin', email: 'ana@escoteiros.pt', name: 'Ana' },
    });
    const { GET } = await import('@/app/api/admin/stats/route');
    const response = await GET(requestFor());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      activities: 0,
      pending_activities: 0,
      users: 0,
      public_programs: 0,
      pending_suggestions: 0,
      pending_reports: 0,
    });
  });
});

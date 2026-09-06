import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockRequireAdminApi = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/lib/auth/utils', () => ({
  requireAdminApi: () => mockRequireAdminApi(),
}));

vi.mock('@/lib/db/server', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => {
          const rows = mockSelect();
          return Object.assign(Promise.resolve(rows), {
            limit: async () => rows,
          });
        },
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => mockUpdate(),
        }),
      }),
    }),
  },
}));

describe('Admin users API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects non-admins on list', async () => {
    const { apiErrors } = await import('@/lib/errors');
    mockRequireAdminApi.mockResolvedValue({ error: apiErrors.forbidden() });
    const { GET } = await import('@/app/api/admin/users/route');
    const response = await GET(new NextRequest('http://localhost/api/admin/users'));
    expect(response.status).toBe(403);
  });

  it('rejects demoting the last admin', async () => {
    mockRequireAdminApi.mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    });
    mockSelect
      .mockResolvedValueOnce([{ value: 1 }])
      .mockResolvedValueOnce([{ role: 'admin' }]);
    const { PATCH } = await import('@/app/api/admin/users/[id]/route');
    const response = await PATCH(
      new NextRequest('http://localhost/api/admin/users/550e8400-e29b-41d4-a716-446655440000', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user' }),
      }),
      { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }) }
    );
    expect(response.status).toBe(409);
  });

  it('updates a role when another admin remains', async () => {
    mockRequireAdminApi.mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    });
    mockSelect
      .mockResolvedValueOnce([{ value: 2 }])
      .mockResolvedValueOnce([{ role: 'admin' }]);
    mockUpdate.mockResolvedValue([{ id: '550e8400-e29b-41d4-a716-446655440000', role: 'user' }]);
    const { PATCH } = await import('@/app/api/admin/users/[id]/route');
    const response = await PATCH(
      new NextRequest('http://localhost/api/admin/users/550e8400-e29b-41d4-a716-446655440000', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user' }),
      }),
      { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }) }
    );
    expect(response.status).toBe(200);
  });
});

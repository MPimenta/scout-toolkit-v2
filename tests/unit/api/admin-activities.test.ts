import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockRequireAdminApi = vi.fn();
const mockCreate = vi.fn();
const mockParse = vi.fn();

vi.mock('@/lib/auth/utils', () => ({
  requireAdminApi: () => mockRequireAdminApi(),
}));

vi.mock('@/lib/activities/write', () => ({
  parseActivityWrite: (...args: unknown[]) => mockParse(...args),
  createActivity: (...args: unknown[]) => mockCreate(...args),
}));

vi.mock('@/lib/db/server', () => ({
  db: {
    select: () => ({ from: () => ({ orderBy: async () => [] }) }),
  },
}));

describe('Admin activities API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParse.mockImplementation((body: Record<string, unknown>) => body);
  });

  it('rejects non-admins', async () => {
    const { apiErrors } = await import('@/lib/errors');
    mockRequireAdminApi.mockResolvedValue({ error: apiErrors.forbidden() });
    const { POST } = await import('@/app/api/admin/activities/route');
    const response = await POST(new NextRequest('http://localhost/api/admin/activities', {
      method: 'POST',
      body: JSON.stringify({ name: 'Jogo' }),
    }));
    expect(response.status).toBe(403);
  });

  it('creates an approved activity for an admin', async () => {
    mockRequireAdminApi.mockResolvedValue({
      user: { id: 'admin-1', role: 'admin', email: 'ana@escoteiros.pt', name: 'Ana' },
    });
    mockCreate.mockResolvedValue({ id: 'act-1', is_approved: true });
    const { POST } = await import('@/app/api/admin/activities/route');
    const response = await POST(new NextRequest('http://localhost/api/admin/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jogo',
        description: 'Desc',
        materials: 'Nada',
        approximate_duration_minutes: 30,
        group_size: 'small',
        effort_level: 'low',
        location: 'outside',
        age_group: 'scouts',
        activity_type_id: '550e8400-e29b-41d4-a716-446655440000',
      }),
    }));
    expect(response.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ isApproved: true }));
  });
});

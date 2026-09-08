import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockRequireAdminApi = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/lib/auth/utils', () => ({
  requireAdminApi: () => mockRequireAdminApi(),
}));

vi.mock('@/lib/db/server', () => ({
  db: {
    insert: () => ({
      values: () => ({
        returning: async () => mockInsert(),
      }),
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => mockSelect(),
        }),
      }),
    }),
    delete: () => ({
      where: async () => mockDelete(),
    }),
  },
}));

describe('Admin taxonomies API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects non-admins', async () => {
    const { apiErrors } = await import('@/lib/errors');
    mockRequireAdminApi.mockResolvedValue({ error: apiErrors.forbidden() });
    const { POST } = await import('@/app/api/admin/taxonomies/[kind]/route');
    const response = await POST(
      new NextRequest('http://localhost/api/admin/taxonomies/activity-types', {
        method: 'POST',
        body: JSON.stringify({ name: 'Jogo', code: 'JOGO' }),
      }),
      { params: Promise.resolve({ kind: 'activity-types' }) }
    );
    expect(response.status).toBe(403);
  });

  it('creates an activity type', async () => {
    mockRequireAdminApi.mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    });
    mockInsert.mockResolvedValue([{ id: 'type-1', name: 'Jogo', code: 'JOGO' }]);
    const { POST } = await import('@/app/api/admin/taxonomies/[kind]/route');
    const response = await POST(
      new NextRequest('http://localhost/api/admin/taxonomies/activity-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Jogo', code: 'JOGO' }),
      }),
      { params: Promise.resolve({ kind: 'activity-types' }) }
    );
    expect(response.status).toBe(201);
  });

  it('returns 409 when deleting a referenced type', async () => {
    mockRequireAdminApi.mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    });
    mockSelect.mockResolvedValue([{ id: 'act-1' }]);
    const { DELETE } = await import('@/app/api/admin/taxonomies/[kind]/route');
    const response = await DELETE(
      new NextRequest('http://localhost/api/admin/taxonomies/activity-types?id=550e8400-e29b-41d4-a716-446655440000'),
      { params: Promise.resolve({ kind: 'activity-types' }) }
    );
    expect(response.status).toBe(409);
  });

  it('rejects a challenge with an unknown type_id', async () => {
    mockRequireAdminApi.mockResolvedValue({
      user: { id: 'admin-1', role: 'admin' },
    });
    mockSelect.mockResolvedValue([]);
    const { POST } = await import('@/app/api/admin/taxonomies/[kind]/route');
    const response = await POST(
      new NextRequest('http://localhost/api/admin/taxonomies/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Completar 5 nós',
          description: 'Lista de 10 nós; basta completar 5',
          type_id: '550e8400-e29b-41d4-a716-446655440099',
        }),
      }),
      { params: Promise.resolve({ kind: 'challenges' }) }
    );
    expect(response.status).toBe(400);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.fn();
const mockCreate = vi.fn();
const mockParse = vi.fn();
const mockSelect = vi.fn();

vi.mock('@/lib/auth/config', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/activities/write', () => ({
  parseActivityWrite: (...args: unknown[]) => mockParse(...args),
  createActivity: (...args: unknown[]) => mockCreate(...args),
  replaceRelations: vi.fn(),
}));

vi.mock('@/lib/db/server', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => mockSelect(),
          orderBy: async () => mockSelect(),
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => mockSelect(),
        }),
      }),
    }),
    delete: () => ({
      where: async () => undefined,
    }),
  },
}));

const body = {
  name: 'Jogo novo',
  description: 'Desc',
  materials: 'Nada',
  approximate_duration_minutes: 30,
  group_size: 'small',
  effort_level: 'low',
  location: 'outside',
  age_group: 'scouts',
  activity_type_id: '550e8400-e29b-41d4-a716-446655440000',
};

describe('User-generated activities API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(null);
    mockParse.mockImplementation((value: Record<string, unknown>) => value);
  });

  it('rejects a guest submit', async () => {
    const { POST } = await import('@/app/api/activities/route');
    const response = await POST(new NextRequest('http://localhost/api/activities', {
      method: 'POST',
      body: JSON.stringify(body),
    }));
    expect(response.status).toBe(401);
  });

  it('creates an unapproved proposal for a signed-in user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', name: 'Bruno' } });
    mockCreate.mockResolvedValue({ id: 'act-1', is_approved: false, created_by: 'user-1' });
    const { POST } = await import('@/app/api/activities/route');
    const response = await POST(new NextRequest('http://localhost/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }));
    expect(response.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({
      createdBy: 'user-1',
      isApproved: false,
    }));
  });

  it('forbids author edits after approval', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockSelect.mockResolvedValue([{ id: 'act-1', created_by: 'user-1', is_approved: true }]);
    const { PATCH } = await import('@/app/api/activities/[id]/route');
    const response = await PATCH(
      new NextRequest('http://localhost/api/activities/550e8400-e29b-41d4-a716-446655440000', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }) }
    );
    expect(response.status).toBe(403);
  });
});

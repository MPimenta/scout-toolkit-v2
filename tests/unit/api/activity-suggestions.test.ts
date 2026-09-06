import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.fn();
const mockRequireAdminApi = vi.fn();
const mockFindPending = vi.fn();
const mockNotifyAdmins = vi.fn();
const mockNotifyUser = vi.fn();
const mockApply = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/lib/auth/config', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/auth/utils', () => ({
  requireAdminApi: () => mockRequireAdminApi(),
}));

vi.mock('@/lib/suggestions', () => ({
  isSuggestableField: (field: string) => ['description', 'name', 'materials'].includes(field),
  findPendingDuplicate: (...args: unknown[]) => mockFindPending(...args),
  notifyAdmins: (...args: unknown[]) => mockNotifyAdmins(...args),
  notifyUser: (...args: unknown[]) => mockNotifyUser(...args),
  applySuggestion: (...args: unknown[]) => mockApply(...args),
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
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => mockUpdate(),
        }),
      }),
    }),
  },
}));

const activityId = '550e8400-e29b-41d4-a716-446655440000';

describe('Activity suggestions API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(null);
    mockFindPending.mockResolvedValue(null);
  });

  it('rejects a guest suggestion', async () => {
    const { POST } = await import('@/app/api/activities/[id]/suggestions/route');
    const response = await POST(
      new NextRequest(`http://localhost/api/activities/${activityId}/suggestions`, {
        method: 'POST',
        body: JSON.stringify({ field: 'description', suggested_value: 'Novo texto' }),
      }),
      { params: Promise.resolve({ id: activityId }) }
    );
    expect(response.status).toBe(401);
  });

  it('rejects an unknown field', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', name: 'Bruno' } });
    const { POST } = await import('@/app/api/activities/[id]/suggestions/route');
    const response = await POST(
      new NextRequest(`http://localhost/api/activities/${activityId}/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'not_a_field', suggested_value: 'x' }),
      }),
      { params: Promise.resolve({ id: activityId }) }
    );
    expect(response.status).toBe(400);
  });

  it('rejects a duplicate pending suggestion', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', name: 'Bruno' } });
    mockFindPending.mockResolvedValue({ id: 'dup-1' });
    const { POST } = await import('@/app/api/activities/[id]/suggestions/route');
    const response = await POST(
      new NextRequest(`http://localhost/api/activities/${activityId}/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'description', suggested_value: 'Novo texto' }),
      }),
      { params: Promise.resolve({ id: activityId }) }
    );
    expect(response.status).toBe(409);
  });

  it('applies a suggestion only when accepted', async () => {
    mockRequireAdminApi.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });
    mockSelect.mockResolvedValue([{
      id: 'sug-1',
      field: 'description',
      suggested_value: 'Texto aceite',
      activity_id: activityId,
      user_id: 'user-1',
    }]);
    mockUpdate.mockResolvedValue([{ id: 'sug-1', status: 'approved' }]);
    const { POST } = await import('@/app/api/admin/suggestions/[id]/review/route');
    const response = await POST(
      new NextRequest('http://localhost/api/admin/suggestions/sug-1/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision: 'approved' }),
      }),
      { params: Promise.resolve({ id: 'sug-1' }) }
    );
    expect(response.status).toBe(200);
    expect(mockApply).toHaveBeenCalledWith('description', 'Texto aceite', activityId);
    expect(mockNotifyUser).toHaveBeenCalled();
  });
});

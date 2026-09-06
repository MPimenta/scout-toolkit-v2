import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.fn();
const mockList = vi.fn();
const mockGet = vi.fn();
const mockInsert = vi.fn();

vi.mock('@/lib/auth/config', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/programs/public', () => ({
  DURATION_BANDS: { short: 'short', medium: 'medium', long: 'long' },
  listPublicPrograms: (...args: unknown[]) => mockList(...args),
  getPublicProgram: (...args: unknown[]) => mockGet(...args),
}));

vi.mock('@/lib/db/server', () => ({
  db: {
    insert: (table: { _: { name?: string } } | unknown) => ({
      values: (values: unknown) => ({
        returning: async () => {
          mockInsert(values);
          if (Array.isArray(values)) return values;
          return [{ id: 'copy-1', ...((values as object) || {}) }];
        },
      }),
    }),
    select: () => ({
      from: () => ({
        where: async () => [{ id: 'copy-1' }],
      }),
    }),
  },
}));

function requestFor(path: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`http://localhost:3000${path}`, init);
}

describe('Public programs API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue(null);
    mockList.mockResolvedValue({ programs: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } });
    mockGet.mockResolvedValue(null);
  });

  it('lists only what the public helper returns', async () => {
    mockList.mockResolvedValue({
      programs: [{ id: 'pub-1', name: 'Acampamento', is_public: true }],
      pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
    });
    const { GET } = await import('@/app/api/programs/public/route');
    const response = await GET(requestFor('/api/programs/public?search=acampamento'));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.programs).toHaveLength(1);
    expect(mockList).toHaveBeenCalledWith(expect.objectContaining({ search: 'acampamento' }));
  });

  it('returns 404 for a missing or private program preview', async () => {
    const { GET } = await import('@/app/api/programs/public/[id]/route');
    const response = await GET(requestFor('/api/programs/public/550e8400-e29b-41d4-a716-446655440000'), {
      params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }),
    });
    expect(response.status).toBe(404);
  });

  it('returns 401 when a guest copies', async () => {
    const { POST } = await import('@/app/api/programs/public/[id]/copy/route');
    const response = await POST(requestFor('/api/programs/public/550e8400-e29b-41d4-a716-446655440000/copy', { method: 'POST' }), {
      params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }),
    });
    expect(response.status).toBe(401);
  });

  it('copies a public program as a private draft', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-2', name: 'Bruno' } });
    mockGet.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Acampamento',
      date: null,
      start_time: '10:00:00',
      author_name: 'Ana',
      entries: [
        {
          position: 1,
          start_time: '10:00:00',
          end_time: '10:30:00',
          entry_type: 'custom',
          custom_title: 'Abertura',
          custom_duration_minutes: 30,
          activity_id: null,
        },
      ],
    });
    const { POST } = await import('@/app/api/programs/public/[id]/copy/route');
    const response = await POST(requestFor('/api/programs/public/550e8400-e29b-41d4-a716-446655440000/copy', { method: 'POST' }), {
      params: Promise.resolve({ id: '550e8400-e29b-41d4-a716-446655440000' }),
    });
    expect(response.status).toBe(201);
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      is_public: false,
      source_author_name: 'Ana',
      name: 'Acampamento (cópia)',
    }));
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.fn();
const mockSelect = vi.fn();
const mockMode = vi.fn();
const mockCounts = vi.fn();

vi.mock('@/lib/auth/config', () => ({ auth: () => mockAuth() }));
vi.mock('@/lib/db/server', () => ({ db: { select: (...a: unknown[]) => mockSelect(...a) } }));
vi.mock('@/lib/orgo/client', () => ({
  getOrgoAttendanceCounts: (...a: unknown[]) => mockCounts(...a),
}));
vi.mock('@/lib/orgo/leader-context', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/orgo/leader-context')>()),
  orgoMode: () => mockMode(),
}));

const PROGRAM_ID = '550e8400-e29b-41d4-a716-446655440220';
const OWNER = { id: 'user-1', email: 'ana@escoteiros.pt', name: 'Ana' };

function useProgram(overrides: Record<string, unknown> = {}) {
  mockSelect.mockReturnValue({
    from: () => ({
      where: async () => [
        {
          id: PROGRAM_ID,
          name: 'Acampamento',
          date: null,
          start_time: '09:00:00',
          is_public: false,
          user_id: OWNER.id,
          orgo_event_uuid: 'evt-1',
          orgo_event_url: null,
          orgo_steps: null,
          ...overrides,
        },
      ],
    }),
  });
}

const get = async () => {
  const { GET } = await import('@/app/api/programs/[id]/orgo/attendance/route');
  return GET(new NextRequest(`http://localhost:3000/api/programs/${PROGRAM_ID}/orgo/attendance`), {
    params: Promise.resolve({ id: PROGRAM_ID }),
  });
};

describe('GET /api/programs/[id]/orgo/attendance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: OWNER });
    mockMode.mockReturnValue('live');
    useProgram();
    mockCounts.mockResolvedValue({ invited: 15, attending: 12 });
  });

  it('requires a signed-in owner', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await get()).status).toBe(401);
    mockAuth.mockResolvedValue({ user: OWNER });
    useProgram({ user_id: 'someone-else' });
    expect((await get()).status).toBe(404);
  });

  it('answers 409 when the program has no event yet', async () => {
    useProgram({ orgo_event_uuid: null });
    expect((await get()).status).toBe(409);
    useProgram({ orgo_event_uuid: 'pending' });
    expect((await get()).status).toBe(409);
  });

  it('returns the invited and attending counts and nothing else', async () => {
    const response = await get();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { invited: 15, attending: 12 } });
    expect(mockCounts).toHaveBeenCalledWith('evt-1');
  });

  it('returns null counts when Orgo cannot say, so the page shows only the eAEP sentence', async () => {
    mockCounts.mockRejectedValue(new Error('403'));
    expect((await (await get()).json()).data).toEqual({ invited: null, attending: null });
    mockCounts.mockResolvedValue(null);
    expect((await (await get()).json()).data).toEqual({ invited: null, attending: null });
  });

  it('has nothing to read in the e2e stub', async () => {
    mockMode.mockReturnValue('stub');
    expect((await (await get()).json()).data).toEqual({ invited: null, attending: null });
    expect(mockCounts).not.toHaveBeenCalled();
  });
});

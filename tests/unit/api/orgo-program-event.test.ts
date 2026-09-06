import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockListUnits = vi.fn();
const mockCreate = vi.fn();
const mockPublish = vi.fn();

vi.mock('@/lib/auth/config', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/db/server', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    execute: async () => [],
  },
}));

vi.mock('@/lib/orgo/client', () => ({
  E2E_STUB_UNITS: [
    { iri: '/api/v1/units/123', name: 'Agrupamento 123' },
    { iri: '/api/v1/units/456', name: 'Agrupamento 456' },
  ],
  listEventCreateUnitsForEmail: (...args: unknown[]) => mockListUnits(...args),
  createOrgoEvent: (...args: unknown[]) => mockCreate(...args),
  publishOrgoEvent: (...args: unknown[]) => mockPublish(...args),
  OrgoRequestError: class OrgoRequestError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

const PROGRAM_ID = '550e8400-e29b-41d4-a716-446655440200';
const OWNER = { id: 'user-1', email: 'ana@escoteiros.pt', name: 'Ana' };

function orgoRequest(method: string, body?: unknown) {
  return new NextRequest(`http://localhost:3000/api/programs/${PROGRAM_ID}/orgo`, {
    method,
    ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
  });
}

function programRow(overrides: Record<string, unknown> = {}) {
  return {
    id: PROGRAM_ID,
    name: 'Acampamento',
    date: '2026-07-12',
    start_time: '09:00:00',
    is_public: false,
    user_id: OWNER.id,
    orgo_event_uuid: null,
    orgo_event_url: null,
    ...overrides,
  };
}

describe('Orgo program event API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env['ORGO_API_TOKEN'] = 'test-token';
    mockAuth.mockResolvedValue({ user: OWNER });
    mockSelect.mockReturnValue({
      from: () => ({
        where: async () => [programRow()],
      }),
    });
    mockUpdate.mockReturnValue({
      set: () => ({
        where: async () => [],
      }),
    });
    mockListUnits.mockResolvedValue([{ iri: '/api/v1/units/123', name: 'Agrupamento 123' }]);
    mockCreate.mockResolvedValue({ uuid: 'evt-1', url: 'https://eaep.escoteiros.pt/events/evt-1' });
  });

  it('returns 503 when the write token is missing', async () => {
    delete process.env['ORGO_API_TOKEN'];
    const { GET } = await import('@/app/api/programs/[id]/orgo/route');
    const response = await GET(orgoRequest('GET'), { params: Promise.resolve({ id: PROGRAM_ID }) });
    expect(response.status).toBe(503);
    expect(mockListUnits).not.toHaveBeenCalled();
  });

  it('rejects a unit that is not on the user list', async () => {
    const { POST } = await import('@/app/api/programs/[id]/orgo/route');
    const response = await POST(
      orgoRequest('POST', {
        dateTimeEnd: '2026-07-12T16:00:00',
        location: 'Quinta',
        unit: '/api/v1/units/999',
      }),
      { params: Promise.resolve({ id: PROGRAM_ID }) }
    );
    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates an event without ticketing and persists the uuid', async () => {
    let entryCall = 0;
    mockSelect.mockImplementation(() => ({
      from: () => ({
        where: async () => {
          entryCall += 1;
          return entryCall === 1 ? [programRow()] : [];
        },
      }),
    }));

    const { POST } = await import('@/app/api/programs/[id]/orgo/route');
    const response = await POST(
      orgoRequest('POST', {
        dateTimeEnd: '2026-07-12T16:00:00',
        location: 'Quinta',
        unit: '/api/v1/units/123',
        timezone: 'Europe/Lisbon',
      }),
      { params: Promise.resolve({ id: PROGRAM_ID }) }
    );
    expect(response.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ hasEventTicketing: false }));
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('leaves the program unlinked when Orgo returns 4xx', async () => {
    const { OrgoRequestError } = await import('@/lib/orgo/client');
    mockCreate.mockRejectedValue(new OrgoRequestError(400, 'unit forbidden'));
    const { POST } = await import('@/app/api/programs/[id]/orgo/route');
    const response = await POST(
      orgoRequest('POST', {
        dateTimeEnd: '2026-07-12T16:00:00',
        location: 'Quinta',
        unit: '/api/v1/units/123',
      }),
      { params: Promise.resolve({ id: PROGRAM_ID }) }
    );
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error.message).toMatch(/eAEP/i);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns 400 when the user has no event-create units', async () => {
    mockListUnits.mockResolvedValue([]);
    const { POST } = await import('@/app/api/programs/[id]/orgo/route');
    const response = await POST(
      orgoRequest('POST', {
        dateTimeEnd: '2026-07-12T16:00:00',
        location: 'Quinta',
        unit: '/api/v1/units/123',
      }),
      { params: Promise.resolve({ id: PROGRAM_ID }) }
    );
    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

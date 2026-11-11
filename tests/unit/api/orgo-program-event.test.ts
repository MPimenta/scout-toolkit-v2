import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockSet = vi.fn();
const mockContext = vi.fn();
const mockMembers = vi.fn();
const mockCreate = vi.fn();
const mockPublish = vi.fn();
const mockInvite = vi.fn();
const mockGetEvent = vi.fn();
const mockAttach = vi.fn();
const mockMode = vi.fn();

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
  createOrgoEvent: (...args: unknown[]) => mockCreate(...args),
  publishOrgoEvent: (...args: unknown[]) => mockPublish(...args),
  inviteOrgoUser: (...args: unknown[]) => mockInvite(...args),
  getOrgoEvent: (...args: unknown[]) => mockGetEvent(...args),
  attachFileToOrgoEvent: (...args: unknown[]) => mockAttach(...args),
  OrgoRequestError: class OrgoRequestError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock('@/lib/orgo/leader-context', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/orgo/leader-context')>()),
  orgoMode: () => mockMode(),
  loadLeaderContext: (...args: unknown[]) => mockContext(...args),
  listMembersInScope: (...args: unknown[]) => mockMembers(...args),
}));

vi.mock('@/lib/export/pdf', () => ({ renderProgramPdf: vi.fn(async () => Buffer.from('%PDF')) }));
vi.mock('@/lib/export/load-program', () => ({ loadProgramForExport: vi.fn(async () => ({ name: 'Acampamento' })) }));

const PROGRAM_ID = '550e8400-e29b-41d4-a716-446655440200';
const OWNER = { id: 'user-1', email: 'ana@escoteiros.pt', name: 'Ana' };
const UNIT = '/api/v1/units/123';

const baseBody = { dateTimeEnd: '2026-07-12T16:00:00', location: 'Quinta', unit: UNIT, timezone: 'Europe/Lisbon' };

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
    orgo_steps: null,
    ...overrides,
  };
}

function useProgram(overrides: Record<string, unknown> = {}) {
  mockSelect.mockReturnValue({
    from: () => ({
      where: async () => [programRow(overrides)],
      // program entries for the event description
      leftJoin: () => ({ where: () => ({ orderBy: async () => [] }) }),
    }),
  });
}

const post = async (body: unknown) => {
  const { POST } = await import('@/app/api/programs/[id]/orgo/route');
  return POST(orgoRequest('POST', body), { params: Promise.resolve({ id: PROGRAM_ID }) });
};

describe('Orgo program event API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: OWNER });
    mockMode.mockReturnValue('live');
    useProgram();
    mockUpdate.mockReturnValue({
      set: (values: unknown) => ({
        _record: mockSet(values),
        // awaited directly (store/release) or with .returning() (the atomic claim)
        where: () => Object.assign(Promise.resolve([]), { returning: async () => [{ id: PROGRAM_ID }] }),
      }),
    });
    mockContext.mockResolvedValue({
      scope: { orgoUserId: '204598', localCenterId: '3200', level: 'local' },
      units: [{ iri: UNIT, name: 'Agrupamento 123' }],
      localUnits: [],
      groupName: 'Agrupamento 123',
      stub: false,
    });
    mockMembers.mockResolvedValue([
      { id: '1001', name: 'Ana Exemplo', cardId: '10001', type: 'Lobito' },
      { id: '1002', name: 'Rui Teste', cardId: '10002', type: 'Lobito' },
    ]);
    mockCreate.mockResolvedValue({ uuid: 'evt-1', url: 'https://eaep.escoteiros.pt/event/evt-1' });
    mockPublish.mockResolvedValue(undefined);
    mockInvite.mockResolvedValue('invited');
    mockGetEvent.mockResolvedValue({ eventId: 7, status: 'published', hasFile: false });
    mockAttach.mockResolvedValue(undefined);
  });

  it('answers 503 when the Orgo integration is not configured', async () => {
    mockMode.mockReturnValue('off');
    const { GET } = await import('@/app/api/programs/[id]/orgo/route');
    const response = await GET(orgoRequest('GET'), { params: Promise.resolve({ id: PROGRAM_ID }) });
    expect(response.status).toBe(503);
    expect((await post(baseBody)).status).toBe(503);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('rejects a unit that is not on the leader list', async () => {
    const response = await post({ ...baseBody, unit: '/api/v1/units/999' });
    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates an event without ticketing, with the HTML description, and persists the uuid', async () => {
    const response = await post(baseBody);
    expect(response.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        hasEventTicketing: false,
        status: 'DRAFT',
        description: expect.stringContaining('<b>Programa «Acampamento»</b>'),
      })
    );
    // claim, then store the real event (the link is rebuilt from the uuid)
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ orgo_event_uuid: 'evt-1', orgo_event_url: expect.stringMatching(/\/event\/evt-1$/) })
    );
    const body = await response.json();
    expect(body.orgo_event_url).toMatch(/\/event\/evt-1$/);
    expect(body.orgo_event_attendance_url).toMatch(/\/events\/attend\/evt-1$/);
  });

  it('leaves the program unlinked when Orgo returns 4xx', async () => {
    const { OrgoRequestError } = await import('@/lib/orgo/client');
    mockCreate.mockRejectedValue(new OrgoRequestError(400, 'unit forbidden'));
    const response = await post(baseBody);
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error.message).toMatch(/eAEP/i);
    // The claim is released: the program ends up without an Orgo link.
    expect(mockSet).toHaveBeenLastCalledWith(expect.objectContaining({ orgo_event_uuid: null, orgo_event_url: null }));
    expect(mockSet).not.toHaveBeenCalledWith(expect.objectContaining({ orgo_event_url: expect.any(String) }));
  });

  it('returns 400 when the leader has no units to create events in', async () => {
    mockContext.mockResolvedValue(null);
    const response = await post(baseBody);
    expect(response.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  describe('participants and attachment', () => {
    it('publishes first, then invites, and records counts only', async () => {
      const response = await post({ ...baseBody, publish: true, participants: ['1001', '1002'] });
      expect(response.status).toBe(201);
      expect(mockPublish).toHaveBeenCalledWith('evt-1');
      expect(mockPublish.mock.invocationCallOrder[0]).toBeLessThan(mockInvite.mock.invocationCallOrder[0] as number);
      expect(mockInvite).toHaveBeenCalledTimes(2);
      const body = await response.json();
      expect(body.published).toBe(true);
      expect(body.steps.invitations).toMatchObject({ status: 'done', requested: 2, added: 2, failed: 0 });
      // No member id appears in what is stored or returned.
      expect(JSON.stringify(body)).not.toContain('1001');
      expect(JSON.stringify(mockSet.mock.calls)).not.toContain('1001');
    });

    it('rejects participants when the event is not going to be published', async () => {
      const response = await post({ ...baseBody, publish: false, participants: ['1001'] });
      expect(response.status).toBe(400);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('rejects a participant that was not offered to this leader, before contacting Orgo', async () => {
      const response = await post({ ...baseBody, publish: true, participants: ['1001', '9999'] });
      expect(response.status).toBe(400);
      expect((await response.json()).error.message).toMatch(/grupo/);
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockInvite).not.toHaveBeenCalled();
    });

    it('rejects more than 500 participants and ids that are not numeric', async () => {
      const many = Array.from({ length: 501 }, (_, i) => String(1000 + i));
      expect((await post({ ...baseBody, publish: true, participants: many })).status).toBe(400);
      expect((await post({ ...baseBody, publish: true, participants: ['../users'] })).status).toBe(400);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('skips the invitations and tells the owner when publishing fails', async () => {
      mockPublish.mockRejectedValue(new Error('refused'));
      mockGetEvent.mockResolvedValue({ eventId: 7, status: 'draft', hasFile: false });
      const response = await post({ ...baseBody, publish: true, participants: ['1001'] });
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.published).toBe(false);
      expect(body.warning).toMatch(/rascunho/);
      expect(body.steps.publish.status).toBe('failed');
      expect(body.steps.invitations).toMatchObject({ status: 'skipped', requested: 1, added: 0 });
      expect(mockInvite).not.toHaveBeenCalled();
    });

    it('reports how many invitations Orgo accepted', async () => {
      mockInvite.mockResolvedValueOnce('invited').mockRejectedValueOnce(new Error('refused'));
      const response = await post({ ...baseBody, publish: true, participants: ['1001', '1002'] });
      const body = await response.json();
      expect(body.steps.invitations).toMatchObject({ status: 'failed', requested: 2, added: 1, failed: 1 });
    });

    it('refuses the PDF attachment for a private program', async () => {
      useProgram({ is_public: false });
      const response = await post({ ...baseBody, attachment: true });
      expect(response.status).toBe(400);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('attaches the PDF for a public program and records the step', async () => {
      useProgram({ is_public: true });
      const response = await post({ ...baseBody, attachment: true });
      expect(response.status).toBe(201);
      expect(mockAttach).toHaveBeenCalledWith(7, expect.objectContaining({ mimeType: 'application/pdf' }));
      expect((await response.json()).steps.attachment.status).toBe('done');
    });

    it('keeps the event and reports the attachment when the upload fails', async () => {
      useProgram({ is_public: true });
      mockAttach.mockRejectedValue(new Error('storage down'));
      const response = await post({ ...baseBody, attachment: true });
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.orgo_event_uuid).toBe('evt-1');
      expect(body.steps.attachment).toMatchObject({ status: 'failed', reason: expect.stringMatching(/sem anexo/) });
    });
  });
});

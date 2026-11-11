import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = vi.fn();
const mockSelect = vi.fn();
const mockMode = vi.fn();
const mockContext = vi.fn();
const mockMembers = vi.fn();
const mockGetEvent = vi.fn();
const mockPublishStep = vi.fn();
const mockInviteStep = vi.fn();
const mockAttachStep = vi.fn();
const mockSave = vi.fn();

vi.mock('@/lib/auth/config', () => ({ auth: () => mockAuth() }));
vi.mock('@/lib/db/server', () => ({ db: { select: (...a: unknown[]) => mockSelect(...a) } }));
vi.mock('@/lib/orgo/client', () => ({
  getOrgoEvent: (...a: unknown[]) => mockGetEvent(...a),
}));
vi.mock('@/lib/orgo/leader-context', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/orgo/leader-context')>()),
  orgoMode: () => mockMode(),
  loadLeaderContext: (...a: unknown[]) => mockContext(...a),
  listMembersInScope: (...a: unknown[]) => mockMembers(...a),
}));
vi.mock('@/lib/orgo/description-data', () => ({
  loadDescriptionProgram: async () => ({
    name: 'Acampamento de Verão',
    blocks: [
      { start: '09:00', end: '09:30', durationMinutes: 30, title: 'Jogo' },
      { start: '09:30', end: '10:00', durationMinutes: 30, title: 'Roda' },
      { start: '10:00', end: '10:30', durationMinutes: 30, title: 'Pausa' },
    ],
    challenges: [{ code: 'CC-A' }],
  }),
}));
vi.mock('@/lib/orgo/steps', () => ({
  runPublishStep: (...a: unknown[]) => mockPublishStep(...a),
  runInvitationsStep: (...a: unknown[]) => mockInviteStep(...a),
  runAttachmentStep: (...a: unknown[]) => mockAttachStep(...a),
  saveOrgoSteps: (...a: unknown[]) => mockSave(...a),
}));

const PROGRAM_ID = '550e8400-e29b-41d4-a716-446655440210';
const OWNER = { id: 'user-1', email: 'ana@escoteiros.pt', name: 'Ana' };
const ctx = () => ({ params: Promise.resolve({ id: PROGRAM_ID }) });

function program(overrides: Record<string, unknown> = {}) {
  return {
    id: PROGRAM_ID,
    name: 'Acampamento de Verão',
    date: '2026-07-12',
    start_time: '09:00:00',
    is_public: false,
    user_id: OWNER.id,
    orgo_event_uuid: 'evt-1',
    orgo_event_url: null,
    orgo_steps: null,
    ...overrides,
  };
}

function useProgram(overrides: Record<string, unknown> = {}) {
  mockSelect.mockReturnValue({ from: () => ({ where: async () => [program(overrides)] }) });
}

const leaderContext = {
  scope: { orgoUserId: '204598', localCenterId: '3200', level: 'local' },
  units: [{ iri: '/api/v1/units/3200', name: 'Grupo 312 Coimbra' }],
  localUnits: [{ id: '3254', name: 'Tribo de Exploradores', kind: 'divisao', parentId: null, userType: 'Explorador' }],
  groupName: 'Grupo 312 Coimbra',
  stub: false,
};

const members = [
  { id: '1001', name: 'Ana Exemplo', cardId: '10001', type: 'Explorador' },
  { id: '1002', name: 'Rui Teste', cardId: '10002', type: 'Explorador' },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: OWNER });
  mockMode.mockReturnValue('live');
  useProgram();
  mockContext.mockResolvedValue(leaderContext);
  mockMembers.mockResolvedValue(members);
  mockGetEvent.mockResolvedValue({ eventId: 7, status: 'published', hasFile: false });
  mockSave.mockImplementation(async (_id: string, patch: object) => patch);
});

describe('GET /api/programs/[id]/orgo/options', () => {
  const get = async (query = '') => {
    const { GET } = await import('@/app/api/programs/[id]/orgo/options/route');
    return GET(new NextRequest(`http://localhost:3000/api/programs/${PROGRAM_ID}/orgo/options${query}`), ctx());
  };

  it('requires a signed-in user', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await get()).status).toBe(401);
  });

  it('answers 404 for a program that belongs to someone else', async () => {
    useProgram({ user_id: 'someone-else' });
    expect((await get()).status).toBe(404);
    expect(mockMembers).not.toHaveBeenCalled();
  });

  it('answers 503 when the integration is not configured', async () => {
    mockMode.mockReturnValue('off');
    expect((await get()).status).toBe(503);
  });

  it('offers the units, the member tree and the attachment rule to the owner', async () => {
    const { data } = await (await get()).json();
    expect(data.units).toEqual(leaderContext.units);
    expect(data.canPublish).toBe(true);
    expect(data.groupName).toBe('Grupo 312 Coimbra');
    expect(data.participants.total).toBe(2);
    expect(data.participants.divisions).toEqual([
      { id: '3254', name: 'Tribo de Exploradores', userType: 'Explorador', count: 2 },
    ]);
    expect(data.attachment).toMatchObject({ allowed: false, reason: 'private' });
    expect(data.attachment.fileName).toMatch(/\.pdf$/);
    // Counts only: the dialog never receives the description HTML.
    expect(data.descriptionSummary).toEqual({ blocks: 3, challenges: 1 });
  });

  it('allows the attachment for a public program', async () => {
    useProgram({ is_public: true });
    const { data } = await (await get()).json();
    expect(data.attachment).toMatchObject({ allowed: true, reason: null });
  });

  it('searches by name or card number on the server', async () => {
    const byName = (await (await get('?q=rui')).json()).data.participants;
    expect(byName.members.map((m: { name: string }) => m.name)).toEqual(['Rui Teste']);
    expect(byName.total).toBe(2);
    const byCard = (await (await get('?q=10001')).json()).data.participants;
    expect(byCard.members.map((m: { name: string }) => m.name)).toEqual(['Ana Exemplo']);
  });

  it('offers nothing when the leader has no event permission or the scope is unknown', async () => {
    mockContext.mockResolvedValue(null);
    const { data } = await (await get()).json();
    expect(data).toMatchObject({ units: [], participants: null, canPublish: false });
    expect(mockMembers).not.toHaveBeenCalled();
  });
});

describe('POST /api/programs/[id]/orgo/retry', () => {
  const retry = async (body: unknown) => {
    const { POST } = await import('@/app/api/programs/[id]/orgo/retry/route');
    return POST(
      new NextRequest(`http://localhost:3000/api/programs/${PROGRAM_ID}/orgo/retry`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      }),
      ctx()
    );
  };

  it('requires a signed-in user and an owned program', async () => {
    mockAuth.mockResolvedValue(null);
    expect((await retry({ step: 'publish' })).status).toBe(401);
    mockAuth.mockResolvedValue({ user: OWNER });
    useProgram({ user_id: 'someone-else' });
    expect((await retry({ step: 'publish' })).status).toBe(404);
  });

  it('refuses an unknown step with 400', async () => {
    expect((await retry({ step: 'create' })).status).toBe(400);
    expect((await retry({})).status).toBe(400);
  });

  it('answers 409 when the program has no event yet, or one is being created', async () => {
    useProgram({ orgo_event_uuid: null });
    expect((await retry({ step: 'publish' })).status).toBe(409);
    useProgram({ orgo_event_uuid: 'pending' });
    expect((await retry({ step: 'publish' })).status).toBe(409);
    expect(mockPublishStep).not.toHaveBeenCalled();
  });

  it('answers 403 when the leader no longer has event permissions', async () => {
    mockContext.mockResolvedValue(null);
    expect((await retry({ step: 'publish' })).status).toBe(403);
  });

  it('does not repeat a step that already succeeded', async () => {
    const done = { publish: { status: 'done', at: 't' } };
    useProgram({ orgo_steps: done });
    const response = await retry({ step: 'publish' });
    expect(response.status).toBe(200);
    expect((await response.json()).steps).toEqual(done);
    expect(mockPublishStep).not.toHaveBeenCalled();
  });

  it('repeats only the publish step', async () => {
    mockPublishStep.mockResolvedValue({ status: 'done', at: 't2' });
    const response = await retry({ step: 'publish' });
    expect(response.status).toBe(200);
    expect(mockPublishStep).toHaveBeenCalledWith('evt-1', false);
    expect(mockInviteStep).not.toHaveBeenCalled();
    expect(mockAttachStep).not.toHaveBeenCalled();
    expect((await response.json()).steps.publish.status).toBe('done');
  });

  describe('invitations', () => {
    it('invites the selection again, only for an event that is published', async () => {
      mockInviteStep.mockResolvedValue({ status: 'done', at: 't', requested: 2, added: 2, failed: 0 });
      const response = await retry({ step: 'invitations', participants: ['1001', '1002'] });
      expect(response.status).toBe(200);
      expect(mockInviteStep).toHaveBeenCalledWith('evt-1', ['1001', '1002'], false);
    });

    it('rejects a participant that was not offered, before contacting Orgo', async () => {
      const response = await retry({ step: 'invitations', participants: ['1001', '9999'] });
      expect(response.status).toBe(400);
      expect(mockInviteStep).not.toHaveBeenCalled();
    });

    it('answers 409 when the event is still a draft', async () => {
      mockGetEvent.mockResolvedValue({ eventId: 7, status: 'draft', hasFile: false });
      const response = await retry({ step: 'invitations', participants: ['1001'] });
      expect(response.status).toBe(409);
      expect(mockInviteStep).not.toHaveBeenCalled();
    });

    it('needs at least one participant', async () => {
      expect((await retry({ step: 'invitations', participants: [] })).status).toBe(400);
    });
  });

  describe('attachment', () => {
    it('is refused for a private program', async () => {
      expect((await retry({ step: 'attachment' })).status).toBe(400);
      expect(mockAttachStep).not.toHaveBeenCalled();
    });

    it('runs for a public program', async () => {
      useProgram({ is_public: true });
      mockAttachStep.mockResolvedValue({ status: 'done', at: 't' });
      const response = await retry({ step: 'attachment' });
      expect(response.status).toBe(200);
      expect(mockAttachStep).toHaveBeenCalledWith(PROGRAM_ID, 'evt-1', false);
    });
  });
});

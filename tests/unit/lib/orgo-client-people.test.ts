import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  OrgoRequestError,
  attachFileToOrgoEvent,
  getOrgoAttendanceCounts,
  getOrgoEvent,
  getOrgoUser,
  inviteOrgoUser,
  listLocalCenterMembers,
  listLocalCenterUnits,
  publishOrgoEvent,
} from '@/lib/orgo/client';

type Call = { url: string; method: string; headers: Record<string, string>; body: unknown };
const calls: Call[] = [];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

/** Routes fake Orgo answers by URL substring; the first matching route wins. */
function stubFetch(routes: Array<[string, (call: Call) => Response]>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL, init: RequestInit = {}) => {
      const call: Call = {
        url: String(input),
        method: init.method ?? 'GET',
        headers: Object.fromEntries(Object.entries((init.headers as Record<string, string>) ?? {})),
        body: init.body,
      };
      calls.push(call);
      const route = routes.find(([match]) => call.url.includes(match));
      if (!route) throw new Error(`unexpected request: ${call.url}`);
      return route[1](call);
    })
  );
}

beforeEach(() => {
  calls.length = 0;
  vi.stubEnv('ORGO_API_TOKEN', 'test-token');
  vi.stubEnv('ORGO_ISSUER', 'https://eaep.example');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('getOrgoUser', () => {
  it('reads status, type, local group and permission names', async () => {
    stubFetch([
      [
        '/api/v1/users/204598',
        () =>
          json({
            id: 204598,
            status: 'ACTIVE',
            type: { name: 'Dirigente' },
            localCenter: { id: 3200, '@id': '/api/v1/local_centers/3200' },
            permissions: ['EVENT_LOCAL', 42, 'HR_LOCAL'],
            email: 'ignored@example.test',
          }),
      ],
    ]);
    expect(await getOrgoUser('204598')).toEqual({
      id: '204598',
      status: 'ACTIVE',
      type: 'Dirigente',
      localCenterId: '3200',
      permissions: ['EVENT_LOCAL', 'HR_LOCAL'],
    });
  });

  it('returns null when Orgo does not know the user', async () => {
    stubFetch([['/api/v1/users/9', () => json({}, 404)]]);
    expect(await getOrgoUser('9')).toBeNull();
  });

  it('refuses an id that is not numeric before calling Orgo', async () => {
    stubFetch([]);
    await expect(getOrgoUser('1/../../me')).rejects.toBeInstanceOf(OrgoRequestError);
    expect(calls).toHaveLength(0);
  });
});

describe('listLocalCenterMembers', () => {
  const row = (id: number, name: string, extra: Record<string, unknown> = {}) => ({
    id,
    fullName: name,
    cardId: `100${id}`,
    status: 'ACTIVE',
    type: { name: 'Explorador' },
    ...extra,
  });

  it('asks Orgo for the chosen local group only and keeps active members', async () => {
    stubFetch([
      [
        'localCenter=3200',
        () => json({ 'hydra:member': [row(1, 'Ana Exemplo'), row(2, 'Rui Teste', { status: 'RESIGNED' })] }),
      ],
    ]);
    const members = await listLocalCenterMembers('3200');
    expect(members).toEqual([{ id: '1', name: 'Ana Exemplo', cardId: '1001', type: 'Explorador' }]);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toContain('localCenter=3200');
    expect(calls[0]?.url).not.toContain('localCenter=3254');
  });

  it('reads further pages until a short page', async () => {
    const full = Array.from({ length: 100 }, (_, i) => row(i + 1, `Membro ${i + 1}`));
    stubFetch([
      ['page=1', () => json({ 'hydra:member': full })],
      ['page=2', () => json({ 'hydra:member': [row(101, 'Último')] })],
    ]);
    const members = await listLocalCenterMembers('3200');
    expect(members).toHaveLength(101);
    expect(calls.map((c) => c.url.match(/page=(\d+)/)?.[1])).toEqual(['1', '2']);
  });

  it('refuses a local group id that is not numeric', async () => {
    stubFetch([]);
    await expect(listLocalCenterMembers('3200&status=x')).rejects.toBeInstanceOf(OrgoRequestError);
    expect(calls).toHaveLength(0);
  });

  it('surfaces an Orgo refusal', async () => {
    stubFetch([['localCenter=3200', () => json({ detail: 'nope' }, 403)]]);
    await expect(listLocalCenterMembers('3200')).rejects.toMatchObject({ status: 403 });
  });
});

describe('listLocalCenterUnits', () => {
  it('returns divisões and patrulhas with their parent and member type', async () => {
    stubFetch([
      ['/api/v1/local_centers/3200', () => json({ localUnits: [{ id: 3255 }, { '@id': '/api/v1/units/3256' }] })],
      [
        '/api/v1/units/3255',
        () => json({ id: 3255, name: 'Tribo de Escoteiros', unitType: { name: 'Divisão' }, userType: { name: 'Escoteiro' }, parent: null }),
      ],
      [
        '/api/v1/units/3256',
        () =>
          json({
            id: 3256,
            name: 'Patrulha Rouxinol',
            unitType: { name: 'Patrulha / Bando / Equipa' },
            userType: { name: 'Escoteiro' },
            parent: { id: 3255 },
          }),
      ],
    ]);
    expect(await listLocalCenterUnits('3200')).toEqual([
      { id: '3255', name: 'Tribo de Escoteiros', kind: 'divisao', parentId: null, userType: 'Escoteiro' },
      { id: '3256', name: 'Patrulha Rouxinol', kind: 'patrulha', parentId: '3255', userType: 'Escoteiro' },
    ]);
  });
});

describe('inviteOrgoUser', () => {
  const invite = () => inviteOrgoUser('abc123', '62424');

  it('invites a member of a published event', async () => {
    stubFetch([['/api/v1/event_attends', () => json({ id: 1 }, 201)]]);
    expect(await invite()).toBe('invited');
    expect(JSON.parse(String(calls[0]?.body))).toEqual({
      event: '/api/v1/events/abc123',
      user: '/api/v1/users/62424',
      isInvited: true,
    });
  });

  it('counts "already attending" as added', async () => {
    stubFetch([['/api/v1/event_attends', () => json({ detail: 'Member is already attending this event' }, 400)]]);
    expect(await invite()).toBe('already');
  });

  it('throws on any other refusal, such as an unpublished event', async () => {
    stubFetch([['/api/v1/event_attends', () => json({ detail: 'Publish the event first' }, 400)]]);
    await expect(invite()).rejects.toMatchObject({ status: 400 });
  });

  it('refuses a member id that is not numeric', async () => {
    stubFetch([]);
    await expect(inviteOrgoUser('abc123', 'x/../1')).rejects.toBeInstanceOf(OrgoRequestError);
    expect(calls).toHaveLength(0);
  });
});

describe('publishOrgoEvent', () => {
  it('sends a merge-patch PATCH, the only content type Orgo accepts there', async () => {
    stubFetch([['/api/v1/events_publish/abc123', () => json({ status: 'published' })]]);
    await publishOrgoEvent('abc123');
    expect(calls[0]?.method).toBe('PATCH');
    expect(calls[0]?.headers['Content-Type']).toBe('application/merge-patch+json');
    expect(calls[0]?.headers['Api-Token']).toBe('test-token');
  });

  it('throws when Orgo refuses, carrying the status', async () => {
    stubFetch([['/api/v1/events_publish/abc123', () => json({ detail: 'nope' }, 415)]]);
    await expect(publishOrgoEvent('abc123')).rejects.toMatchObject({ status: 415 });
  });
});

describe('getOrgoEvent and getOrgoAttendanceCounts', () => {
  it('reads the numeric id and status', async () => {
    stubFetch([['/api/v1/events/abc123', () => json({ id: 54250, status: 'published' })]]);
    expect(await getOrgoEvent('abc123')).toEqual({ eventId: 54250, status: 'published', hasFile: false });
  });

  it('reports whether the event already carries a file, so a retry never attaches twice', async () => {
    stubFetch([
      [
        '/api/v1/events/abc123',
        () => json({ id: 54250, status: 'draft', eventMedia: [{ id: 1, media: { type: 'eventfile' } }] }),
      ],
    ]);
    expect((await getOrgoEvent('abc123'))?.hasFile).toBe(true);
    stubFetch([
      ['/api/v1/events/abc123', () => json({ id: 54250, status: 'draft', eventMedia: [{ id: 2, media: { type: 'eventimage' } }] })],
    ]);
    expect((await getOrgoEvent('abc123'))?.hasFile).toBe(false);
  });

  it('reads the invited and attending counts from the analytics, without reading people', async () => {
    stubFetch([
      [
        '/api/v1/events/abc123/analytics',
        () =>
          json({
            attendees: { invited: 15 },
            rsvp: { attending: 12, maybe: 2 },
            capacity: { max: null, filled: 15 },
            revenue: {},
          }),
      ],
    ]);
    expect(await getOrgoAttendanceCounts('abc123')).toEqual({ invited: 15, attending: 12 });
  });

  it('returns null counts for what Orgo does not report, and null when it refuses', async () => {
    stubFetch([['/analytics', () => json({ attendees: {}, rsvp: null })]]);
    expect(await getOrgoAttendanceCounts('abc123')).toEqual({ invited: null, attending: null });
    stubFetch([['/analytics', () => json({}, 403)]]);
    expect(await getOrgoAttendanceCounts('abc123')).toBeNull();
  });
});

describe('attachFileToOrgoEvent', () => {
  const file = { name: 'programa.pdf', mimeType: 'application/pdf', bytes: new Uint8Array([1, 2, 3]) };
  const signed = (url: string) =>
    json({ url, newFileName: 'programa-xyz.pdf', additionalData: { key: 'media/eventfile/programa-xyz.pdf' } });

  it('signs, uploads to storage without the API token, then registers the file', async () => {
    stubFetch([
      ['/api/v1/s3-upload', () => signed('https://orgostatic.s3.eu-central-1.amazonaws.com')],
      ['amazonaws.com', () => new Response(null, { status: 204 })],
      ['/api/v1/medias', () => json({ id: 9 }, 201)],
    ]);
    await attachFileToOrgoEvent(54250, file);

    expect(calls.map((c) => c.method + ' ' + new URL(c.url).pathname)).toEqual([
      'GET /api/v1/s3-upload',
      'POST /',
      'POST /api/v1/medias',
    ]);
    expect(calls[0]?.url).toContain('type=eventfile');
    expect(calls[1]?.headers['Api-Token']).toBeUndefined();
    expect(calls[0]?.headers['Api-Token']).toBe('test-token');
    expect(JSON.parse(String(calls[2]?.body))).toEqual({
      contentUrl: 'programa-xyz.pdf',
      mimeType: 'application/pdf',
      type: 'eventfile',
      size: 3,
      entityId: 54250,
    });
  });

  it('refuses a storage address that is not https on amazonaws.com', async () => {
    stubFetch([['/api/v1/s3-upload', () => signed('https://evil.example/upload')]]);
    await expect(attachFileToOrgoEvent(54250, file)).rejects.toMatchObject({ status: 502 });
    expect(calls).toHaveLength(1);
  });

  it('stops before registering when the storage upload fails', async () => {
    stubFetch([
      ['/api/v1/s3-upload', () => signed('https://orgostatic.s3.eu-central-1.amazonaws.com')],
      ['amazonaws.com', () => new Response('denied', { status: 403 })],
    ]);
    await expect(attachFileToOrgoEvent(54250, file)).rejects.toMatchObject({ status: 403 });
    expect(calls.some((c) => c.url.includes('/api/v1/medias'))).toBe(false);
  });
});

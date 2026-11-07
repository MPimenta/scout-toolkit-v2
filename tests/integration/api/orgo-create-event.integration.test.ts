import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { POST, GET } from '@/app/api/programs/[id]/orgo/route';
import { ORGO_PENDING } from '@/lib/orgo/claim';
import { withTestDatabase, type TestDatabaseHandle } from '../../helpers/database';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { programs, user } from '../../../drizzle/schema';

const mockAuth = vi.fn();
const mockCreate = vi.fn();
const mockPublish = vi.fn();
const UNIT = '/api/v1/units/123';

vi.mock('@/lib/auth/config', () => ({ auth: () => mockAuth() }));
vi.mock('@/lib/orgo/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/orgo/config')>()),
  isOrgoWriteConfigured: () => true,
  isE2EOrgoStub: () => false,
}));
vi.mock('@/lib/orgo/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/orgo/client')>()),
  listEventCreateUnitsForEmail: async () => [{ iri: UNIT, name: 'Agrupamento 123' }],
  createOrgoEvent: (...args: unknown[]) => mockCreate(...args),
  publishOrgoEvent: (...args: unknown[]) => mockPublish(...args),
}));

const OWNER_ID = '550e8400-e29b-41d4-a716-446655440501';
const PROGRAM_ID = '550e8400-e29b-41d4-a716-446655440502';
const ctx = () => ({ params: Promise.resolve({ id: PROGRAM_ID }) });
const validBody = {
  dateTimeEnd: '2026-11-14T11:30',
  location: 'Sede',
  unit: UNIT,
  publish: false,
  timezone: 'Europe/Lisbon',
};
const post = (body: unknown) =>
  POST(new NextRequest(`http://localhost:3000/api/programs/${PROGRAM_ID}/orgo`, { method: 'POST', body: JSON.stringify(body) }), ctx());

describe('Create Orgo event from a program', () => {
  let db: TestDatabaseHandle['db'];
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    requireLocalTestDatabase();
    const setup = await withTestDatabase();
    db = setup.db;
    cleanup = setup.cleanup;
  });

  beforeEach(async () => {
    await db.insert(user).values({ id: OWNER_ID, email: 'dono-orgo@escoteiros.pt', name: 'Dona', role: 'user' });
    await db.insert(programs).values({
      id: PROGRAM_ID,
      name: 'Reunião de sábado',
      date: '2026-11-14',
      start_time: '09:30',
      user_id: OWNER_ID,
    });
    mockAuth.mockResolvedValue({ user: { id: OWNER_ID, role: 'user', email: 'dono-orgo@escoteiros.pt', name: 'Dona' } });
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  const stored = async () =>
    (await db.select().from(programs).where(eq(programs.id, PROGRAM_ID)))[0]!;

  it('rejects an end before the start with 400 and does not call Orgo', async () => {
    const response = await post({ ...validBody, dateTimeEnd: '2026-11-14T09:00' });
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe('VALIDATION_ERROR');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('rejects a non-positive capacity and a missing unit with 400', async () => {
    expect((await post({ ...validBody, maxCapacity: -3 })).status).toBe(400);
    expect((await post({ ...validBody, unit: undefined })).status).toBe(400);
    expect((await post({ ...validBody, unit: '/api/v1/units/999' })).status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates exactly one event when two requests arrive together', async () => {
    mockCreate.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ uuid: 'evt-1', url: 'https://eaep.escoteiros.pt/events/evt-1' }), 50))
    );
    const [a, b] = await Promise.all([post(validBody), post(validBody)]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect((await stored()).orgo_event_uuid).toBe('evt-1');
  });

  it('leaves the program unchanged when Orgo refuses, so the owner can retry', async () => {
    const { OrgoRequestError } = await import('@/lib/orgo/client');
    mockCreate.mockRejectedValueOnce(new OrgoRequestError(422, 'unidade inválida'));
    const refused = await post(validBody);
    expect(refused.status).toBe(502);
    expect((await stored()).orgo_event_uuid).toBeNull();

    mockCreate.mockResolvedValueOnce({ uuid: 'evt-2', url: 'https://eaep.escoteiros.pt/events/evt-2' });
    expect((await post(validBody)).status).toBe(201);
  });

  it('keeps the created event as a draft when publishing fails, and never duplicates on retry', async () => {
    mockCreate.mockResolvedValue({ uuid: 'evt-3', url: 'https://eaep.escoteiros.pt/events/evt-3' });
    mockPublish.mockRejectedValue(new Error('publish refused'));

    const response = await post({ ...validBody, publish: true });
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({ orgo_event_uuid: 'evt-3', published: false });
    expect(body.warning).toMatch(/rascunho/);
    expect((await stored()).orgo_event_url).toBe('https://eaep.escoteiros.pt/events/evt-3');

    const retry = await post({ ...validBody, publish: true });
    expect(retry.status).toBe(409);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('reports a fresh claim as creation in progress', async () => {
    await db.update(programs).set({ orgo_event_uuid: ORGO_PENDING, updated_at: new Date() }).where(eq(programs.id, PROGRAM_ID));
    const get = await GET(new NextRequest(`http://localhost:3000/api/programs/${PROGRAM_ID}/orgo`), ctx());
    expect((await get.json()).pending).toBe(true);
    expect((await post(validBody)).status).toBe(409);
  });

  it('lets a stale claim (over 5 minutes) be taken over', async () => {
    await db
      .update(programs)
      .set({ orgo_event_uuid: ORGO_PENDING, updated_at: new Date(Date.now() - 6 * 60 * 1000) })
      .where(eq(programs.id, PROGRAM_ID));
    // A stale claim still reads as pending to the owner until someone retries...
    mockCreate.mockResolvedValue({ uuid: 'evt-4', url: 'https://eaep.escoteiros.pt/events/evt-4' });
    const { claimProgramForOrgo } = await import('@/lib/orgo/claim');
    expect(await claimProgramForOrgo(PROGRAM_ID, OWNER_ID)).toBe(true);
  });
});

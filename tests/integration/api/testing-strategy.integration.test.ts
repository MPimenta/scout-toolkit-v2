import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../setup';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { getBoundTestDb } from '../../helpers/bound-test-db';
import { activities, activityTypes, programs, user } from '../../../drizzle/schema';

vi.mock('@/lib/db/server', async () => {
  const { getBoundTestDb } = await import('../../helpers/bound-test-db');
  return {
    get db() {
      return getBoundTestDb();
    },
  };
});

const mockAuth = vi.fn();
vi.mock('@/lib/auth/config', () => ({
  auth: () => mockAuth(),
}));

const mockRequireAdminApi = vi.fn();
vi.mock('@/lib/auth/utils', () => ({
  requireAdminApi: () => mockRequireAdminApi(),
}));

const AUTHOR_ID = '550e8400-e29b-41d4-a716-446655440101';
const COPIER_ID = '550e8400-e29b-41d4-a716-446655440102';
const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440103';
const TYPE_ID = '550e8400-e29b-41d4-a716-446655440104';
const ACTIVITY_ID = '550e8400-e29b-41d4-a716-446655440105';
const UNAPPROVED_ID = '550e8400-e29b-41d4-a716-446655440106';
const PROGRAM_ID = '550e8400-e29b-41d4-a716-446655440107';

describe('Testing strategy SQL cases', () => {
  beforeAll(async () => {
    requireLocalTestDatabase();
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    requireLocalTestDatabase();
    await resetTestDatabase();
    mockAuth.mockReset();
    mockRequireAdminApi.mockReset();
    mockAuth.mockResolvedValue(null);
    mockRequireAdminApi.mockResolvedValue({
      user: { id: ADMIN_ID, role: 'admin' },
    });
  });

  it('copies a public program as a private draft with attribution', async () => {
    const db = getBoundTestDb();
    await db.insert(user).values([
      { id: AUTHOR_ID, email: 'ana@escoteiros.pt', name: 'Ana', role: 'user' },
      { id: COPIER_ID, email: 'bruno@escoteiros.pt', name: 'Bruno', role: 'user' },
    ]);
    await db.insert(programs).values({
      id: PROGRAM_ID,
      name: 'Acampamento',
      date: '2026-09-06',
      start_time: '09:00',
      user_id: AUTHOR_ID,
      is_public: true,
    });
    mockAuth.mockResolvedValue({ user: { id: COPIER_ID, name: 'Bruno' } });

    const { POST } = await import('@/app/api/programs/public/[id]/copy/route');
    const response = await POST(
      new NextRequest(`http://localhost:3000/api/programs/public/${PROGRAM_ID}/copy`, {
        method: 'POST',
      }),
      { params: Promise.resolve({ id: PROGRAM_ID }) }
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.attribution).toBe('Ana');

    const [copied] = await db
      .select()
      .from(programs)
      .where(eq(programs.id, body.program.id));
    expect(copied.name).toBe('Acampamento (cópia)');
    expect(copied.is_public).toBe(false);
    expect(copied.user_id).toBe(COPIER_ID);
    expect(copied.source_program_id).toBe(PROGRAM_ID);
    expect(copied.source_author_name).toBe('Ana');
  });

  it('rejects demoting the last admin', async () => {
    const db = getBoundTestDb();
    await db.insert(user).values({
      id: ADMIN_ID,
      email: 'admin@escoteiros.pt',
      name: 'Admin',
      role: 'admin',
    });

    const { PATCH } = await import('@/app/api/admin/users/[id]/route');
    const response = await PATCH(
      new NextRequest(`http://localhost:3000/api/admin/users/${ADMIN_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user' }),
      }),
      { params: Promise.resolve({ id: ADMIN_ID }) }
    );

    expect(response.status).toBe(409);
    const [stillAdmin] = await db.select().from(user).where(eq(user.id, ADMIN_ID));
    expect(stillAdmin.role).toBe('admin');
  });

  it('returns 409 when deleting a referenced activity type', async () => {
    const db = getBoundTestDb();
    await db.insert(activityTypes).values({
      id: TYPE_ID,
      name: 'Jogo',
      description: 'Jogos',
    });
    await db.insert(activities).values({
      id: ACTIVITY_ID,
      name: 'Jogo da bandeira',
      description: 'Uma atividade',
      materials: 'Bandeira',
      approximate_duration_minutes: 30,
      group_size: 'medium',
      effort_level: 'low',
      location: 'outside',
      age_group: 'scouts',
      activity_type_id: TYPE_ID,
      is_approved: true,
    });

    const { DELETE } = await import('@/app/api/admin/taxonomies/[kind]/route');
    const response = await DELETE(
      new NextRequest(
        `http://localhost:3000/api/admin/taxonomies/activity-types?id=${TYPE_ID}`,
        { method: 'DELETE' }
      ),
      { params: Promise.resolve({ kind: 'activity-types' }) }
    );

    expect(response.status).toBe(409);
    const [type] = await db.select().from(activityTypes).where(eq(activityTypes.id, TYPE_ID));
    expect(type).toBeDefined();
  });

  it('returns 404 when a guest requests an unapproved activity', async () => {
    const db = getBoundTestDb();
    await db.insert(user).values({
      id: AUTHOR_ID,
      email: 'autor@escoteiros.pt',
      name: 'Autor',
      role: 'user',
    });
    await db.insert(activityTypes).values({
      id: TYPE_ID,
      name: 'Jogo',
    });
    await db.insert(activities).values({
      id: UNAPPROVED_ID,
      name: 'Proposta nova',
      description: 'Ainda por aprovar',
      materials: 'Nada',
      approximate_duration_minutes: 20,
      group_size: 'small',
      effort_level: 'low',
      location: 'inside',
      age_group: 'scouts',
      activity_type_id: TYPE_ID,
      created_by: AUTHOR_ID,
      is_approved: false,
    });
    mockAuth.mockResolvedValue(null);

    const { GET } = await import('@/app/api/activities/[id]/route');
    const response = await GET(
      new NextRequest(`http://localhost:3000/api/activities/${UNAPPROVED_ID}`),
      { params: Promise.resolve({ id: UNAPPROVED_ID }) }
    );

    expect(response.status).toBe(404);
  });
});

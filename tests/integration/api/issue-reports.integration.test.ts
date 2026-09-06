import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { POST } from '@/app/api/reports/route';
import { GET as listReports } from '@/app/api/admin/reports/route';
import { PATCH as closeReport } from '@/app/api/admin/reports/[id]/route';
import { withTestDatabase } from '../../helpers/database';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { issueReports, notifications, user } from '../../../drizzle/schema';
import { resetReportRateLimit } from '@/lib/reports';

const mockAuth = vi.fn();

vi.mock('@/lib/auth/config', () => ({
  auth: () => mockAuth(),
}));

const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440010';
const MEMBER_ID = '550e8400-e29b-41d4-a716-446655440011';

function postReport(body: unknown, ip = '203.0.113.10') {
  return POST(new NextRequest('http://localhost:3000/api/reports', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  }));
}

const validBody = {
  kind: 'ideia',
  message: 'O botão de filtros está tapado.',
  path: '/activities',
  locale: 'pt',
  viewport: '390x844',
};

describe('Issue reports API', () => {
  let db: Awaited<ReturnType<typeof withTestDatabase>>['db'];
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    requireLocalTestDatabase();
    const setup = await withTestDatabase();
    db = setup.db;
    cleanup = setup.cleanup;
  });

  afterAll(async () => {
    if (cleanup) await cleanup();
  });

  beforeEach(async () => {
    resetReportRateLimit();
    mockAuth.mockResolvedValue(null);
    await db.insert(user).values([
      { id: ADMIN_ID, email: 'admin-reports@escoteiros.pt', name: 'Admin', role: 'admin' },
      { id: MEMBER_ID, email: 'member-reports@escoteiros.pt', name: 'Membro', role: 'user' },
    ]);
  });

  afterEach(async () => {
    await db.delete(notifications);
    await db.delete(issueReports);
    await db.delete(user);
  });

  it('stores a guest report without contact and notifies admins', async () => {
    const response = await postReport(validBody);
    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload.report.user_id).toBeNull();
    expect(payload.report.path).toBe('/activities');
    expect(payload.report.kind).toBe('ideia');

    const rows = await db.select().from(issueReports);
    expect(rows).toHaveLength(1);

    const notes = await db.select().from(notifications).where(eq(notifications.type, 'issue_report'));
    expect(notes).toHaveLength(1);
    expect(notes[0]?.user_id).toBe(ADMIN_ID);
  });

  it('attaches the signed-in user and ignores a forged user id', async () => {
    mockAuth.mockResolvedValue({
      user: { id: MEMBER_ID, role: 'user', email: 'member-reports@escoteiros.pt', name: 'Membro' },
    });
    const response = await postReport({ ...validBody, kind: 'incidente', user_id: ADMIN_ID, path: '/programs/abc' });
    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload.report.user_id).toBe(MEMBER_ID);
    expect(payload.report.path).toBe('/programs/abc');
  });

  it('returns 400 when the message is too short', async () => {
    const response = await postReport({ ...validBody, message: 'curto' });
    expect(response.status).toBe(400);
    const rows = await db.select().from(issueReports);
    expect(rows).toHaveLength(0);
  });

  it('returns 429 on the sixth guest post from the same address', async () => {
    for (let i = 0; i < 5; i += 1) {
      const ok = await postReport({ ...validBody, message: `Mensagem válida número ${i + 1}` });
      expect(ok.status).toBe(201);
    }
    const blocked = await postReport({ ...validBody, message: 'Mensagem válida número 6' });
    expect(blocked.status).toBe(429);
  });

  it('rejects guests and members on the admin list', async () => {
    mockAuth.mockResolvedValue(null);
    const guest = await listReports(new NextRequest('http://localhost:3000/api/admin/reports'));
    expect(guest.status).toBe(401);

    mockAuth.mockResolvedValue({
      user: { id: MEMBER_ID, role: 'user', email: 'member-reports@escoteiros.pt', name: 'Membro' },
    });
    const member = await listReports(new NextRequest('http://localhost:3000/api/admin/reports'));
    expect(member.status).toBe(403);
  });

  it('lets an admin list and close a report', async () => {
    const created = await postReport(validBody);
    const { report } = await created.json() as { report: { id: string } };

    mockAuth.mockResolvedValue({
      user: { id: ADMIN_ID, role: 'admin', email: 'admin-reports@escoteiros.pt', name: 'Admin' },
    });
    const listed = await listReports(new NextRequest('http://localhost:3000/api/admin/reports?status=aberto'));
    expect(listed.status).toBe(200);
    const listPayload = await listed.json();
    expect(listPayload.reports[0].id).toBe(report.id);

    const closed = await closeReport(
      new NextRequest(`http://localhost:3000/api/admin/reports/${report.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'fechado' }),
      }),
      { params: Promise.resolve({ id: report.id }) }
    );
    expect(closed.status).toBe(200);
    const [row] = await db.select().from(issueReports).where(eq(issueReports.id, report.id));
    expect(row?.status).toBe('fechado');
    expect(row?.closed_by).toBe(ADMIN_ID);
  });
});

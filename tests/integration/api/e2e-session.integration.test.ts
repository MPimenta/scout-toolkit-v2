import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/e2e/session/route';
import { withTestDatabase, type TestDatabaseHandle } from '../../helpers/database';
import { requireLocalTestDatabase } from '../../helpers/local-test-db';
import { session } from '../../../drizzle/schema';

function loginRequest() {
  return new NextRequest('http://localhost:3000/api/e2e/session', {
    method: 'POST',
    body: JSON.stringify({ email: 'e2e.gate@example.com', name: 'Chefe Gate' }),
  });
}

describe('E2E login helper gate', () => {
  let db: TestDatabaseHandle['db'];
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    requireLocalTestDatabase();
    const setup = await withTestDatabase();
    db = setup.db;
    cleanup = setup.cleanup;
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  it('returns 404 and creates no session when E2E_LOGIN is not set', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('E2E_LOGIN', '');
    const response = await POST(loginRequest());
    expect(response.status).toBe(404);
    expect(await db.select().from(session)).toHaveLength(0);
  });

  it('creates a session when E2E_LOGIN=1 outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('E2E_LOGIN', '1');
    const response = await POST(loginRequest());
    expect(response.status).toBe(200);
    expect(await db.select().from(session)).toHaveLength(1);
  });

  it('returns 404 in production even with E2E_LOGIN=1', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('E2E_LOGIN', '1');
    const response = await POST(loginRequest());
    expect(response.status).toBe(404);
    expect(await db.select().from(session)).toHaveLength(0);
  });
});

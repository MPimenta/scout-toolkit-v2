import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  apiErrors,
  GENERIC_INTERNAL_MESSAGE,
  handleApiError,
} from '@/lib/errors/api-error-handler';

vi.mock('@/lib/errors/error-logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
  apiLogger: { error: vi.fn(), request: vi.fn(), response: vi.fn() },
  log: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

/** Shape of the error Drizzle throws when a query fails. */
function drizzleQueryError() {
  const error = new Error(
    'Failed query: select "programs"."id", "user"."name" from "programs" where "programs"."is_public" = $1\nparams: true'
  );
  error.stack = `${error.message}\n    at PostgresJsPreparedQuery.queryWithCache (/var/task/node_modules/drizzle-orm/pg-core/session.js:73:11)`;
  return error;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('API error responses in production', () => {
  it('hides SQL, stack traces and file paths for unexpected errors', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const response = handleApiError(drizzleQueryError(), 'GET /api/programs/public');
    const text = JSON.stringify(await response.json());

    expect(response.status).toBe(500);
    expect(JSON.parse(text)).toEqual({
      error: { code: 'INTERNAL_ERROR', message: GENERIC_INTERNAL_MESSAGE },
    });
    expect(text).not.toMatch(/select|programs|params|stack|node_modules|\/var\/task/i);
  });

  it('keeps the field name on validation errors', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const response = apiErrors.validation('name', 'O nome é obrigatório');
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: { code: 'VALIDATION_ERROR', message: 'O nome é obrigatório', details: { field: 'name' } },
    });
  });

  it('keeps deliberate messages such as a 503 explanation', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const response = apiErrors.unavailable('Integração Orgo não configurada');
    expect(response.status).toBe(503);
    expect((await response.json()).error.message).toBe('Integração Orgo não configurada');
  });
});

describe('API error responses outside production', () => {
  it('includes the internal message to help debugging', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const response = handleApiError(drizzleQueryError(), 'GET /api/programs/public');
    const body = await response.json();
    expect(body.error.message).toContain('Failed query');
    expect(body.error.details.stack).toContain('queryWithCache');
  });
});

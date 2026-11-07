import { afterEach, describe, expect, it, vi } from 'vitest';
import { filterEventCreateUnits, findOrgoUserId, roleAllowsEventCreate } from '@/lib/orgo/client';

// Role payload shapes as returned by Orgo /api/v1/user_roles (fields this app reads).
const eventCapable = { unit: { id: 123, name: 'Agrupamento 123' }, localCenterPermission: 'EVENT_LOCAL' };
const adminCapable = { unit: { '@id': '/api/v1/units/456', name: 'Agrupamento 456' }, localCenterPermission: 'ADMIN_LOCAL' };
const memberOnly = { unit: { id: 999, name: 'Outro' }, localCenterPermission: 'USER' };
const ended = { ...eventCapable, unit: { id: 777, name: 'Antigo' }, dateEnded: '2025-12-31' };

describe('filterEventCreateUnits', () => {
  it('keeps units with EVENT_ or ADMIN_ permissions', () => {
    expect(filterEventCreateUnits([eventCapable, adminCapable, memberOnly])).toEqual([
      { iri: '/api/v1/units/123', name: 'Agrupamento 123' },
      { iri: '/api/v1/units/456', name: 'Agrupamento 456' },
    ]);
  });

  it('returns nothing when no role grants event creation (no fallback to membership units)', () => {
    expect(filterEventCreateUnits([memberOnly, { unit: { id: 2, name: 'Agrupamento 2' } }])).toEqual([]);
  });

  it('skips ended roles', () => {
    expect(filterEventCreateUnits([ended])).toEqual([]);
  });

  it('does not match permission-like text in unrelated fields', () => {
    expect(roleAllowsEventCreate({ unit: { id: 1, name: 'EVENT_ grupo' }, note: 'EVENT_LOCAL' })).toBe(false);
    expect(roleAllowsEventCreate({ isAdmin: true })).toBe(true);
  });
});

describe('findOrgoUserId', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  function stubSearch(members: Array<{ id: number; email: string }>) {
    vi.stubEnv('ORGO_API_TOKEN', 'test-token');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ 'hydra:member': members }))));
  }

  it('matches the email exactly, ignoring case', async () => {
    stubSearch([{ id: 5, email: 'Ana.Silva@Escoteiros.pt' }]);
    expect(await findOrgoUserId('ana.silva@escoteiros.pt')).toBe('/api/v1/users/5');
  });

  it('returns null when the search only finds someone else', async () => {
    stubSearch([{ id: 8, email: 'outra.pessoa@escoteiros.pt' }]);
    expect(await findOrgoUserId('ana.silva@escoteiros.pt')).toBeNull();
  });
});

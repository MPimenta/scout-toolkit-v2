import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetOrgoUser = vi.fn();
const mockSelectRows = vi.fn();

vi.mock('@/lib/orgo/client', () => ({
  getOrgoUser: (...args: unknown[]) => mockGetOrgoUser(...args),
}));

vi.mock('@/lib/db/server', () => ({
  db: {
    select: () => ({
      from: () => ({ where: () => ({ limit: async () => mockSelectRows() }) }),
    }),
  },
}));

import {
  permissionLevel,
  resolveLeaderScope,
  scopeFromUser,
} from '@/lib/orgo/scope';

const leader = {
  id: '204598',
  status: 'ACTIVE',
  type: 'Dirigente',
  localCenterId: '3200',
  permissions: ['ADMIN_LOCAL', 'COMMUNICATION_LOCAL', 'EVENT_LOCAL', 'HR_LOCAL'],
};

describe('permissionLevel', () => {
  it('reads the level from the suffix of event permissions', () => {
    expect(permissionLevel('EVENT_LOCAL')).toBe('local');
    expect(permissionLevel('EVENT_PARENT_LOCAL')).toBe('parent_local');
    expect(permissionLevel('EVENT_TENANT')).toBe('tenant');
    expect(permissionLevel('ADMIN_LOCAL')).toBe('local');
  });

  it('treats permissions it does not recognise as not allowed', () => {
    expect(permissionLevel('HR_LOCAL')).toBeNull();
    expect(permissionLevel('COMMUNICATION_TENANT')).toBeNull();
    expect(permissionLevel('EVENT_SOMETHING_NEW')).toBeNull();
    expect(permissionLevel('USER')).toBeNull();
    expect(permissionLevel('')).toBeNull();
  });
});

describe('scopeFromUser', () => {
  it("gives the leader's own local group", () => {
    expect(scopeFromUser(leader)).toEqual({
      orgoUserId: '204598',
      localCenterId: '3200',
      level: 'local',
    });
  });

  it('keeps the own local group for a higher level and reports the highest level', () => {
    const scope = scopeFromUser({ ...leader, permissions: ['EVENT_LOCAL', 'EVENT_PARENT_LOCAL', 'EVENT_TENANT'] });
    expect(scope).toEqual({ orgoUserId: '204598', localCenterId: '3200', level: 'tenant' });
  });

  it('returns nothing without an event permission', () => {
    expect(scopeFromUser({ ...leader, permissions: ['HR_LOCAL', 'COMMUNICATION_LOCAL'] })).toBeNull();
    expect(scopeFromUser({ ...leader, permissions: [] })).toBeNull();
  });

  it('returns nothing for an inactive user or one without a local group', () => {
    expect(scopeFromUser({ ...leader, status: 'RESIGNED' })).toBeNull();
    expect(scopeFromUser({ ...leader, localCenterId: null })).toBeNull();
  });
});

describe('resolveLeaderScope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectRows.mockResolvedValue([{ providerAccountId: '204598' }]);
    mockGetOrgoUser.mockResolvedValue(leader);
  });

  it('looks the leader up by the Orgo user id stored at login', async () => {
    const scope = await resolveLeaderScope('app-user-1');
    expect(mockGetOrgoUser).toHaveBeenCalledWith('204598');
    expect(scope?.localCenterId).toBe('3200');
  });

  it('returns null when the app user has no Orgo account', async () => {
    mockSelectRows.mockResolvedValue([]);
    expect(await resolveLeaderScope('app-user-1')).toBeNull();
    expect(mockGetOrgoUser).not.toHaveBeenCalled();
  });

  it('returns null when the stored account id is not a numeric Orgo id', async () => {
    mockSelectRows.mockResolvedValue([{ providerAccountId: '../users' }]);
    expect(await resolveLeaderScope('app-user-1')).toBeNull();
    expect(mockGetOrgoUser).not.toHaveBeenCalled();
  });

  it('returns null when Orgo does not know the user', async () => {
    mockGetOrgoUser.mockResolvedValue(null);
    expect(await resolveLeaderScope('app-user-1')).toBeNull();
  });
});

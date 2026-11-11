import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { account } from '../../../drizzle/schema';
import { getOrgoUser, type OrgoUserRecord } from './client';

/**
 * How far a leader's Orgo permissions reach. The token the app uses is an admin's, so Orgo
 * never limits what a leader may see through the app: this module is where that is decided.
 * For now every level resolves to the leader's own local group; `level` is kept so the
 * parent-group and national views can be added later without changing how scope is read.
 */
export type LeaderScope = {
  orgoUserId: string;
  /** The leader's own local group: the only group whose members are offered. */
  localCenterId: string;
  level: 'local' | 'parent_local' | 'tenant';
};

/** Scope used by the e2e stub, which has no Orgo behind it. */
export const E2E_STUB_SCOPE: LeaderScope = {
  orgoUserId: '0',
  localCenterId: '0',
  level: 'local',
};

/** Permissions that let a leader create events, matching how event-create units are found. */
const EVENT_PREFIXES = ['EVENT_', 'ADMIN_'];

/** Level of one permission string, or null when it is not an event permission we understand. */
export function permissionLevel(permission: string): LeaderScope['level'] | null {
  const value = permission.trim().toUpperCase();
  if (!EVENT_PREFIXES.some((prefix) => value.startsWith(prefix))) return null;
  // Order matters: _PARENT_LOCAL also ends with _LOCAL.
  if (value.endsWith('_TENANT')) return 'tenant';
  if (value.endsWith('_PARENT_LOCAL')) return 'parent_local';
  if (value.endsWith('_LOCAL')) return 'local';
  return null;
}

const LEVEL_RANK: Record<LeaderScope['level'], number> = { local: 0, parent_local: 1, tenant: 2 };

/**
 * Scope of an Orgo user, or null when they may not invite anyone: not active, no local
 * group, no event permission, or only permissions this app does not recognise.
 */
export function scopeFromUser(user: OrgoUserRecord): LeaderScope | null {
  if (user.status && user.status !== 'ACTIVE') return null;
  if (!user.localCenterId) return null;
  let level: LeaderScope['level'] | null = null;
  for (const permission of user.permissions) {
    const found = permissionLevel(permission);
    if (found && (level === null || LEVEL_RANK[found] > LEVEL_RANK[level])) level = found;
  }
  if (!level) return null;
  return { orgoUserId: user.id, localCenterId: user.localCenterId, level };
}

/** The Orgo user id (the login's `sub`) stored by the auth adapter for an app user. */
export async function getOrgoUserIdForAppUser(appUserId: string): Promise<string | null> {
  const [row] = await db
    .select({ providerAccountId: account.providerAccountId })
    .from(account)
    .where(and(eq(account.userId, appUserId), eq(account.provider, 'orgo')))
    .limit(1);
  return row?.providerAccountId ?? null;
}

/**
 * The signed-in leader's scope, read from Orgo on every call so a role change applies
 * without a new login. Returns null when the scope cannot be determined.
 */
export async function resolveLeaderScope(appUserId: string): Promise<LeaderScope | null> {
  const orgoUserId = await getOrgoUserIdForAppUser(appUserId);
  if (!orgoUserId || !/^\d+$/.test(orgoUserId)) return null;
  const user = await getOrgoUser(orgoUserId);
  return user ? scopeFromUser(user) : null;
}

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { user } from '../../../drizzle/schema';

export type UserRole = 'user' | 'admin';

export function parseAdminEmails(raw = process.env['ADMIN_EMAILS']): string[] {
  return (raw ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined, raw = process.env['ADMIN_EMAILS']): boolean {
  if (!email) return false;
  return parseAdminEmails(raw).includes(email.toLowerCase());
}

export async function loadUserRole(userId: string): Promise<UserRole> {
  const [row] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  return row?.role === 'admin' ? 'admin' : 'user';
}

export async function promoteAdminEmail(userId: string, email: string | null | undefined): Promise<UserRole> {
  if (!isAdminEmail(email)) {
    return loadUserRole(userId);
  }

  await db.update(user).set({ role: 'admin' }).where(eq(user.id, userId));
  return 'admin';
}

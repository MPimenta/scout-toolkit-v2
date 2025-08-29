import { auth } from './config';

export async function getSession() {
  return await auth();
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error('Authentication required');
  }
  return session.user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  return user;
}

export function isAdmin(user: { role: string }) {
  return user.role === 'admin';
}

export function isAuthenticated(user: { id: string } | null) {
  return !!user?.id;
}

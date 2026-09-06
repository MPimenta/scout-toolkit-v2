import { NextResponse } from 'next/server';
import { apiErrors } from '@/lib/errors';
import { auth } from './config';
import { getEffectiveRole } from './view-as';

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
  if ((await getEffectiveRole(user.role)) !== 'admin') {
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

export async function requireAdminApi() {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: apiErrors.unauthorized('Autenticação necessária') as NextResponse };
  }
  if ((await getEffectiveRole(session.user.role)) !== 'admin') {
    return { error: apiErrors.forbidden('Acesso de administrador necessário') as NextResponse };
  }
  return { user: session.user };
}

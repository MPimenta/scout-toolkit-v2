// TODO: Fix NextAuth v5 beta compatibility
// import { getServerSession } from 'next-auth';
// import { authOptions } from './auth';

// export async function getSession() {
//   return await getServerSession(authOptions);
// }

// export async function getCurrentUser() {
//   const session = await getSession();
//   return session?.user;
// }

// export async function requireAuth() {
//   const session = await getSession();
//   if (!session) {
//     throw new Error('Authentication required');
//   }
//   return session.user;
// }

// export async function requireAdmin() {
//   const user = await requireAuth();
//   if (user.role !== 'admin') {
//     throw new Error('Admin access required');
//   }
//   return user;
// }

// export function isAdmin(user: { role: string }) {
//   return user.role === 'admin';
// }

// export function isAuthenticated(user: { id: string } | null) {
//   return !!user?.id;
// }

// Temporary placeholder functions
export async function getSession() {
  return null;
}

export async function getCurrentUser() {
  return null;
}

export async function requireAuth() {
  throw new Error('Authentication temporarily disabled');
}

export async function requireAdmin() {
  throw new Error('Authentication temporarily disabled');
}

export function isAdmin(user: { role: string }) {
  return false;
}

export function isAuthenticated(user: { id: string } | null) {
  return false;
}

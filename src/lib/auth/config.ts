import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db/server';
import { log } from '@/lib/errors';
import type { NextAuthConfig } from 'next-auth';
import { loadUserRole, promoteAdminEmail } from './roles';
import { OrgoProvider } from './orgo-provider';

export const authConfig: NextAuthConfig = {
  providers: [
    OrgoProvider({
      clientId: process.env['ORGO_CLIENT_ID']!,
      clientSecret: process.env['ORGO_CLIENT_SECRET']!,
    }),
  ],
  adapter: DrizzleAdapter(db),
  secret: process.env['NEXTAUTH_SECRET']!,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'orgo') {
        log.warn('Rejected sign-in from unexpected provider', {
          provider: account?.provider,
        });
        return false;
      }

      if (!user.email) {
        log.warn('Orgo sign-in without email', { userId: user.id });
        return false;
      }

      if (user.id) {
        await promoteAdminEmail(user.id, user.email);
      }

      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (await loadUserRole(user.id)) || user.role || 'user';
      }
      return session;
    },
  },
};

const nextAuth = NextAuth(authConfig);

export const { handlers, signIn, signOut, auth } = nextAuth;

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: 'user' | 'admin';
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    role: 'user' | 'admin';
  }
}

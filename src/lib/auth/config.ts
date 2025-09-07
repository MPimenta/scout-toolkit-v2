import NextAuth from "next-auth"
import GoogleProvider from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db/server';
import { log } from '@/lib/errors';
import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env['GOOGLE_CLIENT_ID']!,
      clientSecret: process.env['GOOGLE_CLIENT_SECRET']!,
    }),
  ],
  adapter: DrizzleAdapter(db),
  secret: process.env['NEXTAUTH_SECRET']!,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user }) {
      // Only allow @escoteiros.pt emails
      if (user.email && user.email.endsWith('@escoteiros.pt')) {
        return true;
      }
      
      // Log unauthorized access attempts
      log.warn('Unauthorized sign-in attempt', { email: user.email });
      return false;
    },
    async session({ session, user }) {
      // Ensure user ID is included in the session
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role || 'user';
      }
      return session;
    },
  },
};

const nextAuth = NextAuth(authConfig);

export const { handlers, signIn, signOut, auth } = nextAuth;

// Extend NextAuth types
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

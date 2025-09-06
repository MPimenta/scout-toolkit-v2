import NextAuth from "next-auth"
import GoogleProvider from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db/server';
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
    async signIn() {
      // TEMPORARILY DISABLED: Domain restriction for @escoteiros.pt emails
      // Only allow @escoteiros.pt emails
      // if (user.email && user.email.endsWith('@escoteiros.pt')) {
      //   return true;
      // }
      // return false;
      
      // Allow all Google emails temporarily
      return true;
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

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);

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

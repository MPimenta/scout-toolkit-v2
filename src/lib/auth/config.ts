import NextAuth from "next-auth"
import GoogleProvider from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db/server';

export const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: DrizzleAdapter(db),
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow @escoteiros.pt emails
      if (user.email && user.email.endsWith('@escoteiros.pt')) {
        return true;
      }
      return false;
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

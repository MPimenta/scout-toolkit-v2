import NextAuth from "next-auth"
import GoogleProvider from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Domain restriction: only allow @escoteiros.pt emails
      if (!user.email?.endsWith('@escoteiros.pt')) {
        return false;
      }
      return true;
    },
    async session({ session, user }) {
      // Add user role to session
      if (session.user) {
        const dbUser = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, user.email!),
        });
        
        session.user.id = user.id;
        session.user.role = dbUser?.role || 'user';
      }
      return session;
    },
    async jwt({ token, user }) {
      // Add user role to JWT token
      if (user) {
        const dbUser = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, user.email!),
        });
        
        token.role = dbUser?.role || 'user';
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
})

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

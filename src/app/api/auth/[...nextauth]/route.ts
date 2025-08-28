// TODO: Fix NextAuth v5 beta compatibility with Next.js 15
// import NextAuth from 'next-auth';
// import { authOptions } from '@/lib/auth/auth';

// const handler = NextAuth(authOptions);

// export const GET = handler;
// export const POST = handler;

export async function GET() {
  return new Response('Auth endpoint - temporarily disabled', { status: 501 });
}

export async function POST() {
  return new Response('Auth endpoint - temporarily disabled', { status: 501 });
}

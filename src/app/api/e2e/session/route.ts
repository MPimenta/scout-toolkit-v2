import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { session, user } from '../../../../../drizzle/schema';

const COOKIE = 'authjs.session-token';
const DAY_MS = 24 * 60 * 60 * 1000;

function e2eLoginAllowed() {
  return process.env.NODE_ENV !== 'production';
}

export async function POST(request: NextRequest) {
  if (!e2eLoginAllowed()) {
    return new NextResponse(null, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const email =
    typeof body.email === 'string' && body.email.includes('@')
      ? body.email
      : `e2e.ratings.${crypto.randomUUID()}@example.com`;
  const name = typeof body.name === 'string' ? body.name : 'Chefe E2E';
  const role = body.role === 'admin' ? 'admin' : 'user';

  let [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!existing) {
    [existing] = await db
      .insert(user)
      .values({ email, name, role })
      .returning({ id: user.id });
  } else if (role === 'admin') {
    await db.update(user).set({ role: 'admin' }).where(eq(user.id, existing.id));
  }

  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + DAY_MS);

  await db.insert(session).values({
    sessionToken,
    userId: existing.id,
    expires,
  });

  const response = NextResponse.json({
    userId: existing.id,
    email,
    sessionToken,
  });
  response.cookies.set({
    name: COOKIE,
    value: sessionToken,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    expires,
  });
  return response;
}

export async function DELETE(request: NextRequest) {
  if (!e2eLoginAllowed()) {
    return new NextResponse(null, { status: 404 });
  }

  const token =
    request.cookies.get(COOKIE)?.value ||
    new URL(request.url).searchParams.get('token') ||
    '';

  if (token) {
    const [row] = await db
      .select({ userId: session.userId })
      .from(session)
      .where(eq(session.sessionToken, token))
      .limit(1);

    await db.delete(session).where(eq(session.sessionToken, token));

    if (row?.userId) {
      const [owner] = await db
        .select({ email: user.email })
        .from(user)
        .where(eq(user.id, row.userId))
        .limit(1);
      if (owner?.email?.startsWith('e2e.ratings.') || owner?.email?.startsWith('e2e.admin.')) {
        await db.delete(user).where(eq(user.id, row.userId));
      }
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.delete(COOKIE);
  return response;
}

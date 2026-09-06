import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/server';
import { notifications } from '../../../../drizzle/schema';
import { apiErrors, withApiErrorHandler } from '@/lib/errors';

export const GET = withApiErrorHandler(async () => {
  const session = await auth();
  if (!session?.user?.id) return apiErrors.unauthorized();
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.user_id, session.user.id))
    .orderBy(desc(notifications.created_at));
  return NextResponse.json({ notifications: rows });
});

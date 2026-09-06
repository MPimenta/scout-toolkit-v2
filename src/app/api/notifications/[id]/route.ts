import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/server';
import { notifications } from '../../../../../drizzle/schema';
import { apiErrors, withApiErrorHandler } from '@/lib/errors';

export const PATCH = withApiErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth();
  if (!session?.user?.id) return apiErrors.unauthorized();
  const { id } = await params;
  const [updated] = await db
    .update(notifications)
    .set({ read_at: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.user_id, session.user.id)))
    .returning();
  if (!updated) return apiErrors.notFound('notificação', id);
  return NextResponse.json({ notification: updated });
});

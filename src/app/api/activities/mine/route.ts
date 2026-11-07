import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/server';
import { activities } from '../../../../../drizzle/schema';
import { apiErrors, withApiErrorHandler } from '@/lib/errors';
import { featureOffResponse } from '@/lib/feature-gate';

export const GET = withApiErrorHandler(async () => {
  const hidden = featureOffResponse('activity-proposals');
  if (hidden) return hidden;

  const session = await auth();
  if (!session?.user?.id) return apiErrors.unauthorized();

  const mine = await db
    .select({
      id: activities.id,
      name: activities.name,
      is_approved: activities.is_approved,
      created_at: activities.created_at,
    })
    .from(activities)
    .where(eq(activities.created_by, session.user.id))
    .orderBy(desc(activities.created_at));

  return NextResponse.json({ activities: mine });
});

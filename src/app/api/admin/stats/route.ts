import { NextResponse } from 'next/server';
import { count, eq } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { activities, editSuggestions, programs, user } from '../../../../../drizzle/schema';
import { requireAdminApi } from '@/lib/auth/utils';
import { apiErrors, withApiErrorHandler } from '@/lib/errors';

export const GET = withApiErrorHandler(async () => {
  const gate = await requireAdminApi();
  if (gate.error) {
    return gate.error;
  }

  try {
    const [
      [{ value: activityCount }],
      [{ value: pendingActivityCount }],
      [{ value: userCount }],
      [{ value: publicProgramCount }],
      [{ value: pendingSuggestionCount }],
    ] = await Promise.all([
      db.select({ value: count() }).from(activities),
      db.select({ value: count() }).from(activities).where(eq(activities.is_approved, false)),
      db.select({ value: count() }).from(user),
      db.select({ value: count() }).from(programs).where(eq(programs.is_public, true)),
      db.select({ value: count() }).from(editSuggestions).where(eq(editSuggestions.status, 'pending')),
    ]);

    return NextResponse.json({
      activities: activityCount,
      pending_activities: pendingActivityCount,
      users: userCount,
      public_programs: publicProgramCount,
      pending_suggestions: pendingSuggestionCount,
    });
  } catch {
    return apiErrors.internal('Não foi possível carregar as estatísticas');
  }
});

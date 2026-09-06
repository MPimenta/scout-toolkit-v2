import { NextRequest, NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { activities } from '../../../../../drizzle/schema';
import { requireAdminApi } from '@/lib/auth/utils';
import { apiErrors, withApiErrorHandler } from '@/lib/errors';
import { createActivity, parseActivityWrite } from '@/lib/activities/write';

export const GET = withApiErrorHandler(async (request: NextRequest) => {
  const gate = await requireAdminApi();
  if (gate.error) return gate.error;

  const pending = new URL(request.url).searchParams.get('pending') === 'true';
  const rows = await db.select().from(activities).orderBy(desc(activities.created_at));
  return NextResponse.json({
    activities: pending ? rows.filter((row) => !row.is_approved) : rows,
  });
});

export const POST = withApiErrorHandler(async (request: NextRequest) => {
  const gate = await requireAdminApi();
  if (gate.error) return gate.error;

  const body = await request.json();
  const parsed = parseActivityWrite(body);
  if (typeof parsed === 'string') {
    return apiErrors.validation('body', parsed);
  }

  const row = await createActivity(parsed, {
    createdBy: gate.user.id,
    isApproved: true,
  });
  return NextResponse.json({ activity: row }, { status: 201 });
});

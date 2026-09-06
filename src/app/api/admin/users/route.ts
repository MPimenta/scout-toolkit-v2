import { NextRequest, NextResponse } from 'next/server';
import { ilike, or, sql, count } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { programs, reviews, activities, user } from '../../../../../drizzle/schema';
import { requireAdminApi } from '@/lib/auth/utils';
import { withApiErrorHandler } from '@/lib/errors';

export const GET = withApiErrorHandler(async (request: NextRequest) => {
  const gate = await requireAdminApi();
  if (gate.error) return gate.error;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

  const where = q
    ? or(ilike(user.name, `%${q}%`), ilike(user.email, `%${q}%`))
    : undefined;

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      program_count: sql<number>`(SELECT COUNT(*) FROM ${programs} WHERE ${programs.user_id} = ${user.id})`,
      review_count: sql<number>`(SELECT COUNT(*) FROM ${reviews} WHERE ${reviews.user_id} = ${user.id})`,
      activity_count: sql<number>`(SELECT COUNT(*) FROM ${activities} WHERE ${activities.created_by} = ${user.id})`,
    })
    .from(user)
    .where(where)
    .limit(limit)
    .offset((page - 1) * limit);

  const [{ value: total }] = await db.select({ value: count() }).from(user).where(where);

  return NextResponse.json({
    users: rows.map((row) => ({
      ...row,
      program_count: Number(row.program_count) || 0,
      review_count: Number(row.review_count) || 0,
      activity_count: Number(row.activity_count) || 0,
    })),
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  });
});

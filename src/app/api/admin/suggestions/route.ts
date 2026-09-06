import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { editSuggestions } from '../../../../../drizzle/schema';
import { requireAdminApi } from '@/lib/auth/utils';
import { withApiErrorHandler } from '@/lib/errors';

export const GET = withApiErrorHandler(async () => {
  const gate = await requireAdminApi();
  if (gate.error) return gate.error;
  const rows = await db.select().from(editSuggestions).where(eq(editSuggestions.status, 'pending')).orderBy(desc(editSuggestions.created_at));
  return NextResponse.json({ suggestions: rows });
});

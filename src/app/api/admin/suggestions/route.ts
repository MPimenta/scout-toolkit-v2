import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { editSuggestions } from '../../../../../drizzle/schema';
import { requireAdminApi } from '@/lib/auth/utils';
import { withApiErrorHandler } from '@/lib/errors';
import { describeValueSuggestion, isValueField } from '@/lib/suggestions';

export const GET = withApiErrorHandler(async () => {
  const gate = await requireAdminApi();
  if (gate.error) return gate.error;
  const rows = await db.select().from(editSuggestions).where(eq(editSuggestions.status, 'pending')).orderBy(desc(editSuggestions.created_at));
  // A suggestion for a format or focus holds an id: give the queue its name.
  const suggestions = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      suggested_label: isValueField(row.field) ? await describeValueSuggestion(row.field, row.suggested_value) : null,
    }))
  );
  return NextResponse.json({ suggestions });
});

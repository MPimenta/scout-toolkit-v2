import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { editSuggestions } from '../../../../../../../drizzle/schema';
import { requireAdminApi } from '@/lib/auth/utils';
import { apiErrors, withApiErrorHandler } from '@/lib/errors';
import { applySuggestion, isSuggestableField, notifyUser } from '@/lib/suggestions';

export const POST = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const gate = await requireAdminApi();
  if (gate.error) return gate.error;
  const { id } = await params;
  const { decision } = await request.json();
  if (decision !== 'approved' && decision !== 'rejected') {
    return apiErrors.validation('decision', 'Decisão inválida');
  }

  const [row] = await db.select().from(editSuggestions).where(eq(editSuggestions.id, id)).limit(1);
  if (!row) return apiErrors.notFound('sugestão', id);

  if (decision === 'approved') {
    if (!isSuggestableField(row.field)) return apiErrors.validation('field', 'Campo inválido');
    await applySuggestion(row.field, row.suggested_value, row.activity_id);
  }

  const [updated] = await db
    .update(editSuggestions)
    .set({
      status: decision,
      reviewed_at: new Date(),
      reviewed_by: gate.user.id,
    })
    .where(eq(editSuggestions.id, id))
    .returning();

  await notifyUser(
    row.user_id,
    decision === 'approved' ? 'suggestion_approved' : 'suggestion_rejected',
    decision === 'approved' ? 'Sugestão aceite' : 'Sugestão recusada',
    `A sua sugestão para ${row.field} foi ${decision === 'approved' ? 'aceite' : 'recusada'}.`,
    `/activities/${row.activity_id}`
  );

  return NextResponse.json({ suggestion: updated });
});

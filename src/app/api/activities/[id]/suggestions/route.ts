import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db/server';
import { editSuggestions } from '../../../../../../drizzle/schema';
import { apiErrors, withApiErrorHandler } from '@/lib/errors';
import { validateUUID } from '@/lib/errors/error-handler';
import { findPendingDuplicate, isSuggestableField, notifyAdmins } from '@/lib/suggestions';

export const POST = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth();
  if (!session?.user?.id) return apiErrors.unauthorized();

  const { id } = await params;
  if (!validateUUID(id).success) return apiErrors.validation('id', 'ID inválido');

  const body = await request.json();
  const field = String(body.field ?? '');
  const suggested_value = String(body.suggested_value ?? '').trim();
  if (!isSuggestableField(field)) return apiErrors.validation('field', 'Campo inválido');
  if (!suggested_value) return apiErrors.validation('suggested_value', 'Valor obrigatório');

  if (await findPendingDuplicate(id, session.user.id, field)) {
    return apiErrors.conflict('Já tem uma sugestão pendente neste campo');
  }

  const [row] = await db.insert(editSuggestions).values({
    activity_id: id,
    user_id: session.user.id,
    field,
    suggested_value,
  }).returning();

  await notifyAdmins(
    'Nova sugestão de edição',
    `${session.user.name || 'Um dirigente'} sugeriu alterar ${field}.`,
    '/admin/sugestoes'
  );

  return NextResponse.json({ suggestion: row }, { status: 201 });
});

export const GET = withApiErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth();
  if (!session?.user?.id) return apiErrors.unauthorized();
  const { id } = await params;
  const mine = await db
    .select()
    .from(editSuggestions)
    .where(and(eq(editSuggestions.activity_id, id), eq(editSuggestions.user_id, session.user.id)));
  return NextResponse.json({ suggestions: mine });
});

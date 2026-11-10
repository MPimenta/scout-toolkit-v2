import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { activities } from '../../../../../../drizzle/schema';
import { requireAdminApi } from '@/lib/auth/utils';
import { apiErrors, withApiErrorHandler } from '@/lib/errors';
import { validateUUID } from '@/lib/errors/error-handler';
import { activityIsReferenced, parseActivityWrite, updateActivity, verifyActivityExtras, verifyActivityGoals, verifyFormatAndFocus } from '@/lib/activities/write';

export const PATCH = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const gate = await requireAdminApi();
  if (gate.error) return gate.error;

  const { id } = await params;
  if (!validateUUID(id).success) return apiErrors.validation('id', 'ID inválido');

  const body = await request.json();
  if (typeof body.is_approved === 'boolean' && Object.keys(body).length === 1) {
    const [updated] = await db
      .update(activities)
      .set({ is_approved: body.is_approved, updated_at: new Date() })
      .where(eq(activities.id, id))
      .returning();
    if (!updated) return apiErrors.notFound('atividade', id);
    return NextResponse.json({ activity: updated });
  }

  const parsed = parseActivityWrite(body);
  if (typeof parsed === 'string') return apiErrors.validation('body', parsed);

  const formatFocusError = await verifyFormatAndFocus(parsed);
  if (formatFocusError) return apiErrors.validation('body', formatFocusError);

  const goalError = await verifyActivityGoals(parsed);
  if (goalError) return apiErrors.validation('body', goalError);

  const extrasError = await verifyActivityExtras(parsed);
  if (extrasError) return apiErrors.validation('body', extrasError);

  const updated = await updateActivity(id, parsed);
  if (!updated) return apiErrors.notFound('atividade', id);
  return NextResponse.json({ activity: updated });
});

export const DELETE = withApiErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const gate = await requireAdminApi();
  if (gate.error) return gate.error;

  const { id } = await params;
  if (!validateUUID(id).success) return apiErrors.validation('id', 'ID inválido');
  if (await activityIsReferenced(id)) {
    return apiErrors.conflict('A atividade ainda é usada num programa');
  }
  await db.delete(activities).where(eq(activities.id, id));
  return NextResponse.json({ success: true });
});

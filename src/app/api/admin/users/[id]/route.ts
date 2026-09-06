import { NextRequest, NextResponse } from 'next/server';
import { eq, count } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { user } from '../../../../../../drizzle/schema';
import { requireAdminApi } from '@/lib/auth/utils';
import { apiErrors, withApiErrorHandler } from '@/lib/errors';
import { validateUUID } from '@/lib/errors/error-handler';

export const PATCH = withApiErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const gate = await requireAdminApi();
  if (gate.error) return gate.error;

  const { id } = await params;
  if (!validateUUID(id).success) return apiErrors.validation('id', 'ID inválido');

  const body = await request.json();
  if (body.role !== 'user' && body.role !== 'admin') {
    return apiErrors.validation('role', 'Papel inválido');
  }

  if (body.role === 'user') {
    const [{ value: admins }] = await db
      .select({ value: count() })
      .from(user)
      .where(eq(user.role, 'admin'));
    const [target] = await db.select({ role: user.role }).from(user).where(eq(user.id, id));
    if (target?.role === 'admin' && admins <= 1) {
      return apiErrors.conflict('Não pode remover o último administrador');
    }
  }

  const [updated] = await db.update(user).set({ role: body.role }).where(eq(user.id, id)).returning();
  if (!updated) return apiErrors.notFound('utilizador', id);
  return NextResponse.json({ user: updated });
});

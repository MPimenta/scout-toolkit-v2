import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { issueReports } from '../../../../../../drizzle/schema';
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
  const uuidValidation = validateUUID(id);
  if (!uuidValidation.success) {
    return apiErrors.validation('id', 'ID do reporte inválido');
  }

  let body: { status?: string } = {};
  try {
    body = await request.json();
  } catch {
    return apiErrors.validation('body', 'Corpo da requisição inválido');
  }

  if (body.status !== 'fechado') {
    return apiErrors.validation('status', 'Só é possível marcar como fechado');
  }

  const [existing] = await db.select({ id: issueReports.id }).from(issueReports).where(eq(issueReports.id, id)).limit(1);
  if (!existing) return apiErrors.notFound('reporte', id);

  const [row] = await db
    .update(issueReports)
    .set({
      status: 'fechado',
      closed_at: new Date(),
      closed_by: gate.user.id,
    })
    .where(eq(issueReports.id, id))
    .returning();

  return NextResponse.json({ report: row });
});

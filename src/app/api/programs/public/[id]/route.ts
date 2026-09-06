import { NextRequest, NextResponse } from 'next/server';
import { apiErrors, withApiErrorHandler } from '@/lib/errors';
import { validateUUID } from '@/lib/errors/error-handler';
import { getPublicProgram } from '@/lib/programs/public';

export const GET = withApiErrorHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  if (!validateUUID(id).success) {
    return apiErrors.validation('id', 'ID do programa inválido');
  }

  const program = await getPublicProgram(id);
  if (!program) {
    return apiErrors.notFound('programa', id);
  }

  return NextResponse.json({ program });
});

import { NextRequest, NextResponse } from 'next/server';
import { apiErrors, withApiErrorHandler } from '@/lib/errors';
import { DURATION_BANDS, listPublicPrograms, type DurationBand } from '@/lib/programs/public';

export const GET = withApiErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);
  const search = searchParams.get('search')?.trim() || undefined;
  const sort = (searchParams.get('sort') as 'name' | 'date' | 'created_at') || 'name';
  const order = searchParams.get('order') === 'desc' ? 'desc' : 'asc';
  const hasDateParam = searchParams.get('has_date');
  const duration = searchParams.get('duration') as DurationBand | null;

  if (duration && !(duration in DURATION_BANDS)) {
    return apiErrors.validation('duration', 'Faixa de duração inválida');
  }

  const result = await listPublicPrograms({
    search,
    hasDate: hasDateParam === 'true' ? true : hasDateParam === 'false' ? false : undefined,
    duration: duration ?? undefined,
    page,
    limit,
    sort: ['name', 'date', 'created_at'].includes(sort) ? sort : 'name',
    order,
  });

  return NextResponse.json(result);
});

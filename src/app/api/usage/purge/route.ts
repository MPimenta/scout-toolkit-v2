import { NextRequest, NextResponse } from 'next/server';
import { featureOffResponse } from '@/lib/feature-gate';
import { handleApiError } from '@/lib/errors';
import { purgeOldUsageEvents } from '@/lib/usage/record';

/**
 * @swagger
 * /api/usage/purge:
 *   get:
 *     summary: Delete usage events older than 13 months
 *     description: Called daily by the Vercel cron with Authorization Bearer CRON_SECRET.
 *     tags: [Usage]
 */
export async function GET(request: NextRequest) {
  const hidden = featureOffResponse('usage-tracking');
  if (hidden) return hidden;

  const secret = process.env['CRON_SECRET'];
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: { code: 'AUTHENTICATION_ERROR', message: 'Não autorizado' } },
      { status: 401 }
    );
  }

  try {
    const removed = await purgeOldUsageEvents();
    return NextResponse.json({ removed });
  } catch (error) {
    return handleApiError(error, 'GET /api/usage/purge');
  }
}

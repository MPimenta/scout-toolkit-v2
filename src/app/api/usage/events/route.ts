import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { apiErrors, log } from '@/lib/errors';
import { featureOffResponse } from '@/lib/feature-gate';
import { shouldRecord } from '@/lib/usage/guard';
import { setVisitorCookie, visitorFor } from '@/lib/usage/from-request';
import { allowUsageEvent } from '@/lib/usage/rate-limit';
import { activityExists, recordUsageEvent, viewedRecently } from '@/lib/usage/record';
import { isEmptySearch, usageEventBodySchema } from '@/lib/usage/schemas';

/**
 * @swagger
 * /api/usage/events:
 *   post:
 *     summary: Record a usage event (search or activity_view)
 *     description: Behind the usage-tracking flag. Answers 204 whether or not the event was stored
 *       (bots, privacy signals and opt-out are silently skipped). program_add is recorded by the server only.
 *     tags: [Usage]
 *     responses:
 *       204: { description: Accepted }
 *       400: { description: Invalid event }
 *       404: { description: Tracking is off }
 *       429: { description: Too many events }
 */
export async function POST(request: NextRequest) {
  const hidden = featureOffResponse('usage-tracking');
  if (hidden) return hidden;

  const body = await request.json().catch(() => null);
  const parsed = usageEventBodySchema.safeParse(body);
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path.join('.') || 'body';
    return apiErrors.validation(field, 'Evento de utilização inválido');
  }

  // Bots, privacy signals and opt-out: nothing is stored and no cookie is set.
  if (!shouldRecord(request)) return new NextResponse(null, { status: 204 });

  const visitor = visitorFor(request);
  if (!allowUsageEvent(visitor.id)) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMIT', message: 'Demasiados eventos. Tenta mais tarde.' } },
      { status: 429 }
    );
  }

  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;
    const event = parsed.data;

    if (event.type === 'search') {
      if (isEmptySearch(event.text, event.filters)) return new NextResponse(null, { status: 204 });
      await recordUsageEvent({
        type: 'search',
        visitorId: visitor.id,
        userId,
        payload: {
          text: event.text,
          filters: event.filters,
          divisions: event.filters.ageGroup ?? [],
          result_count: event.result_count,
        },
      });
    } else {
      if (!(await activityExists(event.activity_id))) {
        return apiErrors.validation('activity_id', 'Atividade desconhecida');
      }
      if (!visitor.isNew && (await viewedRecently(visitor.id, event.activity_id))) {
        return new NextResponse(null, { status: 204 });
      }
      await recordUsageEvent({ type: 'activity_view', visitorId: visitor.id, userId, activityId: event.activity_id });
    }
  } catch (error) {
    // Never break the page because recording failed.
    log.error('Usage event failed', error as Error);
    return new NextResponse(null, { status: 204 });
  }

  return setVisitorCookie(new NextResponse(null, { status: 204 }), visitor);
}

import { and, desc, eq, isNull, lt } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { log } from '@/lib/errors';
import { isFeatureEnabled } from '@/lib/features';
import { activities, usageEvents, type UsageEventType } from '../../../drizzle/schema';

export const VIEW_DEDUP_MINUTES = 30;
export const RETENTION_MONTHS = 13;

interface NewEvent {
  type: UsageEventType;
  visitorId: string;
  userId?: string | null;
  activityId?: string | null;
  programId?: string | null;
  payload?: Record<string, unknown> | null;
}

/** Stores one event. Never throws: a failure to record must not reach the visitor. */
export async function recordUsageEvent(event: NewEvent): Promise<boolean> {
  try {
    await db.insert(usageEvents).values({
      type: event.type,
      visitor_id: event.visitorId,
      user_id: event.userId ?? null,
      activity_id: event.activityId ?? null,
      program_id: event.programId ?? null,
      payload: event.payload ?? null,
    });
    if (event.userId) await linkVisitorToUser(event.visitorId, event.userId);
    return true;
  } catch (error) {
    log.error('Could not record usage event', error as Error);
    return false;
  }
}

/** Events recorded for this browser before sign-in become the signed-in user's. */
export async function linkVisitorToUser(visitorId: string, userId: string): Promise<void> {
  try {
    await db
      .update(usageEvents)
      .set({ user_id: userId })
      .where(and(eq(usageEvents.visitor_id, visitorId), isNull(usageEvents.user_id)));
  } catch (error) {
    log.error('Could not link visitor to user', error as Error);
  }
}

export async function activityExists(activityId: string): Promise<boolean> {
  const [row] = await db.select({ id: activities.id }).from(activities).where(eq(activities.id, activityId)).limit(1);
  return Boolean(row);
}

/** True when this visitor already viewed this activity within the de-duplication window. */
export async function viewedRecently(visitorId: string, activityId: string, now = new Date()): Promise<boolean> {
  const since = new Date(now.getTime() - VIEW_DEDUP_MINUTES * 60 * 1000);
  const [last] = await db
    .select({ at: usageEvents.occurred_at })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.visitor_id, visitorId),
        eq(usageEvents.activity_id, activityId),
        eq(usageEvents.type, 'activity_view')
      )
    )
    .orderBy(desc(usageEvents.occurred_at))
    .limit(1);
  return Boolean(last && last.at >= since);
}

/** Deletes events older than the retention period; returns how many were removed. */
export async function purgeOldUsageEvents(now = new Date()): Promise<number> {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS);
  const removed = await db
    .delete(usageEvents)
    .where(lt(usageEvents.occurred_at, cutoff))
    .returning({ id: usageEvents.id });
  log.info('Usage events purged', { removed: removed.length });
  return removed.length;
}

export function isTrackingEnabled(): boolean {
  return isFeatureEnabled('usage-tracking');
}


import { cookies } from 'next/headers';
import { log } from '@/lib/errors';
import { isTrackingEnabled, linkVisitorToUser } from './record';
import { VISITOR_COOKIE, isVisitorId } from './visitor';

/** On sign-in, attributes the events recorded for this browser to the user. Never throws. */
export async function linkVisitorOnSignIn(userId: string): Promise<void> {
  if (!isTrackingEnabled()) return;
  try {
    const visitorId = (await cookies()).get(VISITOR_COOKIE)?.value;
    if (isVisitorId(visitorId)) await linkVisitorToUser(visitorId, userId);
  } catch (error) {
    log.error('Could not link visitor on sign-in', error as Error);
  }
}

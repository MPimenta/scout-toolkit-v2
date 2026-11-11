import type { NextRequest, NextResponse } from 'next/server';
import { shouldRecord } from './guard';
import { isTrackingEnabled, recordUsageEvent } from './record';
import { VISITOR_COOKIE, isVisitorId, visitorCookieOptions } from './visitor';

export interface Visitor {
  id: string;
  isNew: boolean;
}

/** The visitor id of this request, creating a new one when the browser has none. */
export function visitorFor(request: NextRequest): Visitor {
  const existing = request.cookies.get(VISITOR_COOKIE)?.value;
  return isVisitorId(existing) ? { id: existing, isNew: false } : { id: crypto.randomUUID(), isNew: true };
}

export function setVisitorCookie<T extends NextResponse>(response: T, visitor: Visitor | null): T {
  if (visitor?.isNew) response.cookies.set(VISITOR_COOKIE, visitor.id, visitorCookieOptions());
  return response;
}

/**
 * Records a program_add from a server route, after the entry was created. Returns the visitor
 * so the route can set the cookie on its response; null when nothing was recorded.
 */
export async function recordProgramAdd(
  request: NextRequest,
  input: { userId: string; activityId: string; programId: string }
): Promise<Visitor | null> {
  if (!isTrackingEnabled() || !shouldRecord(request)) return null;
  const visitor = visitorFor(request);
  const stored = await recordUsageEvent({
    type: 'program_add',
    visitorId: visitor.id,
    userId: input.userId,
    activityId: input.activityId,
    programId: input.programId,
  });
  return stored ? visitor : null;
}

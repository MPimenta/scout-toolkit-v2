/** The anonymous first-party visitor id (openspec: usage-tracking). */
export const VISITOR_COOKIE = 'visitor_id';
export const VISITOR_MAX_AGE_SECONDS = 60 * 60 * 24 * 395; // about 13 months

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isVisitorId(value: string | undefined | null): value is string {
  return typeof value === 'string' && UUID.test(value);
}

export function visitorCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: VISITOR_MAX_AGE_SECONDS,
  };
}

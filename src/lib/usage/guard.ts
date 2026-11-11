/**
 * Decides whether a request may be recorded (openspec: usage-tracking). Bots, headless tools,
 * privacy signals and the opt-out cookie all mean "do not record, do not set a cookie".
 * The user-agent is only matched here; it is never stored.
 */
export const TRACKING_OFF_COOKIE = 'tracking_off';

const BOT_PATTERN =
  /bot\b|crawl|spider|slurp|headless|lighthouse|pingdom|uptime|monitor|facebookexternalhit|preview|curl\/|wget|python-requests|httpclient|node-fetch|axios|undici|go-http-client/i;

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;
  return BOT_PATTERN.test(userAgent);
}

interface RequestLike {
  headers: Headers;
  cookies: { get(name: string): { value: string } | undefined };
}

export function shouldRecord(request: RequestLike): boolean {
  if (request.headers.get('sec-gpc') === '1') return false;
  if (request.headers.get('dnt') === '1') return false;
  if (request.cookies.get(TRACKING_OFF_COOKIE)?.value === '1') return false;
  return !isBotUserAgent(request.headers.get('user-agent'));
}

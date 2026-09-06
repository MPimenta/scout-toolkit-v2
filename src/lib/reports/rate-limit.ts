const WINDOW_MS = 10 * 60 * 1000;
const windows = new Map<string, number[]>();

export const GUEST_REPORT_LIMIT = 5;
export const SIGNED_IN_REPORT_LIMIT = 20;

export function resetReportRateLimit() {
  windows.clear();
}

export function allowReport(key: string, limit: number, now = Date.now()): boolean {
  const recent = (windows.get(key) ?? []).filter((stamp) => now - stamp < WINDOW_MS);
  if (recent.length >= limit) {
    windows.set(key, recent);
    return false;
  }
  recent.push(now);
  windows.set(key, recent);
  return true;
}

export function reportClientKey(request: { headers: Headers }, userId?: string | null) {
  if (userId) return `user:${userId}`;
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();
  return `ip:${forwarded || realIp || 'unknown'}`;
}

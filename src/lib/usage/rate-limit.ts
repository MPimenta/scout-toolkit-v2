const WINDOW_MS = 60 * 1000;
export const USAGE_EVENTS_PER_MINUTE = 60;
const windows = new Map<string, number[]>();

export function resetUsageRateLimit() {
  windows.clear();
}

/** Abuse guard per visitor (in memory, per instance); not a quota. */
export function allowUsageEvent(key: string, now = Date.now()): boolean {
  const recent = (windows.get(key) ?? []).filter((stamp) => now - stamp < WINDOW_MS);
  if (recent.length >= USAGE_EVENTS_PER_MINUTE) {
    windows.set(key, recent);
    return false;
  }
  recent.push(now);
  windows.set(key, recent);
  return true;
}

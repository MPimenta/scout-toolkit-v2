const DEFAULT_ISSUER = 'https://eaep.escoteiros.pt';
const DEFAULT_TIMEZONE = 'Europe/Lisbon';

export function getOrgoIssuer(): string {
  return (process.env['ORGO_ISSUER'] ?? DEFAULT_ISSUER).replace(/\/$/, '');
}

export function getOrgoApiToken(): string | undefined {
  const token = process.env['ORGO_API_TOKEN']?.trim();
  return token || undefined;
}

/**
 * Address of an event page in eAEP. Built from the uuid every time, never read from
 * stored text: the app used to store `/events/<uuid>`, which is not a page in eAEP.
 */
export function orgoEventUrl(uuid: string): string {
  return `${getOrgoIssuer()}/event/${encodeURIComponent(uuid)}`;
}

/** Address of the attendance page of an event in eAEP. */
export function orgoAttendanceUrl(uuid: string): string {
  return `${getOrgoIssuer()}/events/attend/${encodeURIComponent(uuid)}`;
}

export function isOrgoWriteConfigured(): boolean {
  return Boolean(getOrgoApiToken());
}

export function resolveTimezone(timezone?: string | null): string {
  const value = timezone?.trim();
  return value || DEFAULT_TIMEZONE;
}

export function isE2EOrgoStub(email?: string | null): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    !isOrgoWriteConfigured() &&
    Boolean(email?.startsWith('e2e.'))
  );
}

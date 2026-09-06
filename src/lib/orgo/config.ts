const DEFAULT_ISSUER = 'https://eaep.escoteiros.pt';
const DEFAULT_TIMEZONE = 'Europe/Lisbon';

export function getOrgoIssuer(): string {
  return (process.env['ORGO_ISSUER'] ?? DEFAULT_ISSUER).replace(/\/$/, '');
}

export function getOrgoApiToken(): string | undefined {
  const token = process.env['ORGO_API_TOKEN']?.trim();
  return token || undefined;
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

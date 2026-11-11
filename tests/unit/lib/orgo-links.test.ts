import { afterEach, describe, expect, it, vi } from 'vitest';
import { orgoAttendanceUrl, orgoEventUrl } from '@/lib/orgo/config';

describe('Orgo event links', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('opens the event page at /event/<uuid>, not the non-existent /events/<uuid>', () => {
    vi.stubEnv('ORGO_ISSUER', 'https://eaep.escoteiros.pt');
    expect(orgoEventUrl('5tkcgp03qa8s89n04vej8rn445')).toBe(
      'https://eaep.escoteiros.pt/event/5tkcgp03qa8s89n04vej8rn445'
    );
  });

  it('opens the attendance page at /events/attend/<uuid>', () => {
    vi.stubEnv('ORGO_ISSUER', 'https://eaep.escoteiros.pt');
    expect(orgoAttendanceUrl('5tkcgp03qa8s89n04vej8rn445')).toBe(
      'https://eaep.escoteiros.pt/events/attend/5tkcgp03qa8s89n04vej8rn445'
    );
  });

  it('follows the configured issuer and ignores a trailing slash', () => {
    vi.stubEnv('ORGO_ISSUER', 'https://other.example/');
    expect(orgoEventUrl('abc')).toBe('https://other.example/event/abc');
  });

  it('encodes the uuid so it cannot change the path', () => {
    vi.stubEnv('ORGO_ISSUER', 'https://eaep.escoteiros.pt');
    expect(orgoEventUrl('a/../b')).toBe('https://eaep.escoteiros.pt/event/a%2F..%2Fb');
  });
});

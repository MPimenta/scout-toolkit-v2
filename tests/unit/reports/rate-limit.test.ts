import { afterEach, describe, expect, it } from 'vitest';
import { allowReport, GUEST_REPORT_LIMIT, resetReportRateLimit } from '@/lib/reports/rate-limit';

describe('report rate limit', () => {
  afterEach(() => {
    resetReportRateLimit();
  });

  it('allows five guest posts then blocks the sixth', () => {
    for (let i = 0; i < GUEST_REPORT_LIMIT; i += 1) {
      expect(allowReport('ip:1.1.1.1', GUEST_REPORT_LIMIT)).toBe(true);
    }
    expect(allowReport('ip:1.1.1.1', GUEST_REPORT_LIMIT)).toBe(false);
  });
});

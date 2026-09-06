import { describe, expect, it } from 'vitest';
import { isAdminEmail, parseAdminEmails } from '@/lib/auth/roles';

describe('admin email allowlist', () => {
  it('parses comma-separated emails', () => {
    expect(parseAdminEmails(' Ana@escoteiros.pt, bruno@escoteiros.pt ')).toEqual([
      'ana@escoteiros.pt',
      'bruno@escoteiros.pt',
    ]);
  });

  it('promotes a listed email', () => {
    expect(isAdminEmail('ANA@escoteiros.pt', 'ana@escoteiros.pt')).toBe(true);
    expect(isAdminEmail('bruno@escoteiros.pt', 'ana@escoteiros.pt')).toBe(false);
  });

  it('treats missing email as a regular user', () => {
    expect(isAdminEmail(undefined, 'ana@escoteiros.pt')).toBe(false);
  });
});

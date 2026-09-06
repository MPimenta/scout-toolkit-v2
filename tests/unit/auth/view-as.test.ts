import { describe, expect, it } from 'vitest';
import { resolveEffectiveRole } from '@/lib/auth/view-as-cookie';

describe('resolveEffectiveRole', () => {
  it('keeps an admin as admin when the overlay is off', () => {
    expect(resolveEffectiveRole('admin', undefined)).toBe('admin');
    expect(resolveEffectiveRole('admin', 'admin')).toBe('admin');
  });

  it('treats an admin with member overlay as a user', () => {
    expect(resolveEffectiveRole('admin', 'member')).toBe('user');
  });

  it('ignores a forged overlay on a stored user', () => {
    expect(resolveEffectiveRole('user', 'member')).toBe('user');
    expect(resolveEffectiveRole('user', 'admin')).toBe('user');
  });

  it('treats a guest as a user', () => {
    expect(resolveEffectiveRole(undefined, 'member')).toBe('user');
    expect(resolveEffectiveRole(null, undefined)).toBe('user');
  });
});

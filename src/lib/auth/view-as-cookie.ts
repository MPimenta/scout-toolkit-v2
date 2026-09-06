import type { UserRole } from './roles';

export const VIEW_AS_COOKIE = 'kit-view-as';
export const VIEW_AS_MEMBER = 'member';

export function resolveEffectiveRole(
  stored?: string | null,
  viewAs?: string | null
): UserRole {
  if (stored !== 'admin') return 'user';
  return viewAs === VIEW_AS_MEMBER ? 'user' : 'admin';
}

import { cookies } from 'next/headers';
import type { UserRole } from './roles';
import { VIEW_AS_COOKIE, resolveEffectiveRole } from './view-as-cookie';

export { VIEW_AS_COOKIE, VIEW_AS_MEMBER, resolveEffectiveRole } from './view-as-cookie';

export async function readViewAsCookie(): Promise<string | undefined> {
  try {
    const store = await cookies();
    return store.get(VIEW_AS_COOKIE)?.value;
  } catch {
    return undefined;
  }
}

export async function getEffectiveRole(stored?: string | null): Promise<UserRole> {
  return resolveEffectiveRole(stored, await readViewAsCookie());
}

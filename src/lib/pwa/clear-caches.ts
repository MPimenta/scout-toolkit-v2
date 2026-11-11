import { CACHE_PREFIX } from './constants';

/** Deletes every cache the service worker created (called on sign-out; shared phones). */
export async function clearPwaCaches(): Promise<void> {
  if (typeof caches === 'undefined') return;
  try {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX)).map((key) => caches.delete(key)));
  } catch {
    // Cache storage can be blocked (private windows); sign-out must still go ahead.
  }
}

import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/sw.js/route';
import { clearPwaCaches } from '@/lib/pwa/clear-caches';
import { buildKillSwitchSource, buildWorkerSource } from '@/lib/pwa/sw-source';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('GET /sw.js', () => {
  it('serves the real worker with no-cache and root scope when the flag is on', async () => {
    vi.stubEnv('FEATURES', 'pwa');
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/javascript');
    expect(res.headers.get('cache-control')).toBe('no-cache');
    expect(res.headers.get('service-worker-allowed')).toBe('/');
    expect(await res.text()).toBe(buildWorkerSource());
  });

  it('serves the self-unregistering worker when the flag is off', async () => {
    vi.stubEnv('FEATURES', '');
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-cache');
    expect(await res.text()).toBe(buildKillSwitchSource());
  });
});

describe('clearPwaCaches', () => {
  it('deletes only the worker caches', async () => {
    const names = ['kit-static-v1', 'kit-pages-v1', 'other'];
    const remove = vi.fn(async (_name: string) => true);
    vi.stubGlobal('caches', { keys: async () => names, delete: remove });
    await clearPwaCaches();
    expect(remove.mock.calls.map(([name]) => name)).toEqual(['kit-static-v1', 'kit-pages-v1']);
  });

  it('does not throw when Cache Storage is unavailable or blocked', async () => {
    vi.stubGlobal('caches', undefined);
    await expect(clearPwaCaches()).resolves.toBeUndefined();
    vi.stubGlobal('caches', {
      keys: async () => {
        throw new Error('blocked');
      },
    });
    await expect(clearPwaCaches()).resolves.toBeUndefined();
  });
});

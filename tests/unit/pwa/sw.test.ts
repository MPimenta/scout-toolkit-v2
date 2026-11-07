import { describe, expect, it, vi } from 'vitest';
import vm from 'node:vm';
import { buildKillSwitchSource, buildWorkerSource } from '@/lib/pwa/sw-source';
import { PAGES_CACHE, STATIC_CACHE } from '@/lib/pwa/constants';

const ORIGIN = 'https://kit.test';

type Listener = (event: Record<string, unknown>) => void;

/** In-memory Cache Storage, keyed by request URL. */
function createCaches(initial: Record<string, Record<string, Response>> = {}) {
  const store = new Map<string, Map<string, Response>>(
    Object.entries(initial).map(([name, entries]) => [name, new Map(Object.entries(entries))])
  );
  const keyOf = (input: Request | string) => new URL(typeof input === 'string' ? input : input.url, ORIGIN).pathname;
  const open = async (name: string) => {
    if (!store.has(name)) store.set(name, new Map());
    const cache = store.get(name)!;
    return {
      put: async (req: Request | string, res: Response) => void cache.set(keyOf(req), res),
      match: async (req: Request | string) => cache.get(keyOf(req))?.clone(),
      add: async (req: string) => {
        const res = await fakeFetch(new Request(new URL(req, ORIGIN)));
        if (!res.ok) throw new Error('add failed');
        cache.set(keyOf(req), res);
      },
    };
  };
  return {
    store,
    open,
    keys: async () => [...store.keys()],
    delete: async (name: string) => store.delete(name),
    match: async (req: string, options?: { cacheName?: string }) => {
      const cache = options?.cacheName ? store.get(options.cacheName) : undefined;
      return cache?.get(keyOf(req))?.clone();
    },
  };
}

let fakeFetch: (request: Request) => Promise<Response>;

function loadWorker(source: string, caches = createCaches()) {
  const listeners = new Map<string, Listener>();
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, listener: Listener) => listeners.set(type, listener),
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn(async () => undefined) },
    registration: { unregister: vi.fn(async () => true) },
  };
  const sandbox = {
    self,
    caches,
    fetch: (input: Request | string, init?: RequestInit) =>
      fakeFetch(typeof input === 'string' ? new Request(new URL(input, ORIGIN), init) : input),
    Response,
    URL,
    Set,
    Array,
    Promise,
    Error,
  };
  vm.runInNewContext(source, sandbox);
  return { listeners, self, caches };
}

function makeEvent(path: string, init: { method?: string; mode?: string; origin?: string } = {}) {
  const url = new URL(path, init.origin ?? ORIGIN);
  let responded: Promise<Response> | null = null;
  const work: Promise<unknown>[] = [];
  return {
    event: {
      request: { method: init.method ?? 'GET', mode: init.mode ?? 'cors', url: url.toString() },
      respondWith: (value: Promise<Response>) => {
        responded = value;
      },
      waitUntil: (value: Promise<unknown>) => void work.push(value),
    },
    result: () => responded,
    settled: () => Promise.all(work),
  };
}

/** A same-origin network response: real fetches return type 'basic'. */
function basic(body: string, status = 200): Response {
  const response = new Response(body, { status });
  Object.defineProperty(response, 'type', { value: 'basic' });
  return response;
}

function networkOk(body = 'ok') {
  fakeFetch = vi.fn(async () => basic(body));
  return fakeFetch as unknown as ReturnType<typeof vi.fn>;
}

describe('service worker: what it never touches', () => {
  const bypass: Array<[string, { method?: string; mode?: string; origin?: string }]> = [
    ['/api/programs/1', {}],
    ['/api/programs/1/export/pdf', { mode: 'navigate' }],
    ['/api/programs/1/export/excel', {}],
    ['/api/auth/session', {}],
    ['/auth/signin', { mode: 'navigate' }],
    ['/media/activity-images/x.png', {}],
    ['/_next/static/chunks/a.js', { method: 'POST' }],
    ['/_next/static/chunks/a.js', { origin: 'https://other.example' }],
    ['/home', {}], // a non-navigation fetch of a document-like path
  ];

  it.each(bypass)('does not respond for %s %j', (path, init) => {
    networkOk();
    const { listeners } = loadWorker(buildWorkerSource());
    const { event, result } = makeEvent(path, init);
    listeners.get('fetch')!(event);
    expect(result()).toBeNull();
  });
});

describe('service worker: static assets', () => {
  it('serves a cached hashed file without touching the network', async () => {
    const network = networkOk('fresh');
    const caches = createCaches({ [STATIC_CACHE]: { '/_next/static/chunks/a.js': new Response('cached') } });
    const { listeners } = loadWorker(buildWorkerSource(), caches);
    const { event, result } = makeEvent('/_next/static/chunks/a.js');
    listeners.get('fetch')!(event);
    expect(await (await result()!).text()).toBe('cached');
    expect(network).not.toHaveBeenCalled();
  });

  it('stores a first successful fetch of a hashed file and brand image', async () => {
    networkOk('js');
    const { listeners, caches } = loadWorker(buildWorkerSource());
    for (const path of ['/_next/static/chunks/b.js', '/brand/favicon.png']) {
      const { event, result } = makeEvent(path);
      listeners.get('fetch')!(event);
      await result();
    }
    expect([...caches.store.get(STATIC_CACHE)!.keys()]).toEqual([
      '/_next/static/chunks/b.js',
      '/brand/favicon.png',
    ]);
  });

  it('does not store a failed response', async () => {
    fakeFetch = vi.fn(async () => new Response('nope', { status: 404 }));
    const { listeners, caches } = loadWorker(buildWorkerSource());
    const { event, result } = makeEvent('/_next/static/chunks/missing.js');
    listeners.get('fetch')!(event);
    expect((await result()!).status).toBe(404);
    expect(caches.store.get(STATIC_CACHE)?.size ?? 0).toBe(0);
  });
});

describe('service worker: navigations', () => {
  it('goes to the network and stores no page when online', async () => {
    const network = networkOk('<html>page</html>');
    const caches = createCaches({ [PAGES_CACHE]: { '/offline': new Response('offline page') } });
    const { listeners } = loadWorker(buildWorkerSource(), caches);
    const { event, result, settled } = makeEvent('/programs/1', { mode: 'navigate' });
    listeners.get('fetch')!(event);
    expect(await (await result()!).text()).toBe('<html>page</html>');
    await settled();
    expect(network).toHaveBeenCalledOnce(); // the navigation only
    expect([...caches.store.keys()]).toEqual([PAGES_CACHE]);
    expect([...caches.store.get(PAGES_CACHE)!.keys()]).toEqual(['/offline']);
  });

  it('puts the offline page back on the next navigation after sign-out cleared the caches', async () => {
    const requests: string[] = [];
    fakeFetch = vi.fn(async (request: Request) => {
      requests.push(new URL(request.url).pathname);
      return basic('<html></html>');
    });
    const { listeners, caches } = loadWorker(buildWorkerSource()); // empty caches, as after sign-out
    const { event, result, settled } = makeEvent('/home', { mode: 'navigate' });
    listeners.get('fetch')!(event);
    await result();
    await settled();
    expect(requests).toEqual(['/home', '/offline']);
    expect([...caches.store.get(PAGES_CACHE)!.keys()]).toEqual(['/offline']);
  });

  it('does not fail the navigation when the offline page cannot be restored', async () => {
    fakeFetch = vi.fn(async (request: Request) =>
      new URL(request.url).pathname === '/offline' ? basic('down', 503) : basic('<html>page</html>')
    );
    const { listeners, caches } = loadWorker(buildWorkerSource());
    const { event, result, settled } = makeEvent('/home', { mode: 'navigate' });
    listeners.get('fetch')!(event);
    expect(await (await result()!).text()).toBe('<html>page</html>');
    await expect(settled()).resolves.toBeDefined();
    expect(caches.store.get(PAGES_CACHE)?.size ?? 0).toBe(0);
  });

  const offlineCaches = () => createCaches({ [PAGES_CACHE]: { '/offline': new Response('offline page') } });
  const failNetwork = () => {
    fakeFetch = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
  };

  it('redirects to the offline page, remembering the requested page, when the network fails', async () => {
    failNetwork();
    const { listeners } = loadWorker(buildWorkerSource(), offlineCaches());
    const { event, result } = makeEvent('/activities?q=fogo', { mode: 'navigate' });
    listeners.get('fetch')!(event);
    const res = await result()!;
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe(`${ORIGIN}/offline?from=%2Factivities%3Fq%3Dfogo`);
  });

  it('serves the stored offline page itself when /offline is requested without a network', async () => {
    failNetwork();
    const { listeners } = loadWorker(buildWorkerSource(), offlineCaches());
    const { event, result } = makeEvent('/offline?from=%2Fprograms', { mode: 'navigate' });
    listeners.get('fetch')!(event);
    expect(await (await result()!).text()).toBe('offline page');
  });

  it('falls back to the browser error when the offline page was never stored', async () => {
    failNetwork();
    const { listeners } = loadWorker(buildWorkerSource());
    const { event, result } = makeEvent('/programs/1', { mode: 'navigate' });
    listeners.get('fetch')!(event);
    expect((await result()!).type).toBe('error');
  });
});

describe('service worker: lifecycle', () => {
  it('precaches the offline page and the assets it references, without credentials', async () => {
    const html = '<link href="/_next/static/css/app.css"><script src="/_next/static/chunks/main.js"></script>';
    const requests: Request[] = [];
    fakeFetch = vi.fn(async (request: Request) => {
      requests.push(request);
      return new Response(new URL(request.url).pathname === '/offline' ? html : 'asset', { status: 200 });
    });
    const { listeners, caches } = loadWorker(buildWorkerSource());
    let work: Promise<unknown> = Promise.resolve();
    listeners.get('install')!({ waitUntil: (p: Promise<unknown>) => (work = p) });
    await work;
    expect(requests[0]!.credentials).toBe('omit');
    expect([...caches.store.get(PAGES_CACHE)!.keys()]).toEqual(['/offline']);
    expect([...caches.store.get(STATIC_CACHE)!.keys()].sort()).toEqual([
      '/_next/static/chunks/main.js',
      '/_next/static/css/app.css',
    ]);
  });

  it('fails the install when the offline page cannot be fetched', async () => {
    fakeFetch = vi.fn(async () => new Response('down', { status: 503 }));
    const { listeners } = loadWorker(buildWorkerSource());
    let work: Promise<unknown> = Promise.resolve();
    listeners.get('install')!({ waitUntil: (p: Promise<unknown>) => (work = p) });
    await expect(work).rejects.toThrow('offline page unavailable');
  });

  it('deletes caches of earlier versions on activate and keeps current and foreign ones', async () => {
    const caches = createCaches({
      'kit-static-v0': {},
      'kit-pages-v0': {},
      [STATIC_CACHE]: {},
      [PAGES_CACHE]: {},
      'someone-elses': {},
    });
    const { listeners, self } = loadWorker(buildWorkerSource(), caches);
    let work: Promise<unknown> = Promise.resolve();
    listeners.get('activate')!({ waitUntil: (p: Promise<unknown>) => (work = p) });
    await work;
    expect([...caches.store.keys()].sort()).toEqual([PAGES_CACHE, STATIC_CACHE, 'someone-elses'].sort());
    expect(self.clients.claim).toHaveBeenCalled();
  });

  it('only skips waiting when the page asks', () => {
    const { listeners, self } = loadWorker(buildWorkerSource());
    listeners.get('message')!({ data: { type: 'OTHER' } });
    expect(self.skipWaiting).not.toHaveBeenCalled();
    listeners.get('message')!({ data: { type: 'SKIP_WAITING' } });
    expect(self.skipWaiting).toHaveBeenCalledOnce();
  });
});

describe('kill-switch worker', () => {
  it('clears the worker caches, unregisters and never handles requests', async () => {
    const caches = createCaches({ [STATIC_CACHE]: {}, [PAGES_CACHE]: {}, 'someone-elses': {} });
    const { listeners, self } = loadWorker(buildKillSwitchSource(), caches);
    expect(listeners.has('fetch')).toBe(false);
    listeners.get('install')!({});
    expect(self.skipWaiting).toHaveBeenCalled();
    let work: Promise<unknown> = Promise.resolve();
    listeners.get('activate')!({ waitUntil: (p: Promise<unknown>) => (work = p) });
    await work;
    expect([...caches.store.keys()]).toEqual(['someone-elses']);
    expect(self.registration.unregister).toHaveBeenCalled();
  });
});


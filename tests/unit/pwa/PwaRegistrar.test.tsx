import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { PwaRegistrar } from '@/components/pwa/PwaRegistrar';

const toast = vi.fn();
vi.mock('sonner', () => ({ toast: (...args: unknown[]) => toast(...args) }));

type Listener = () => void;

function fakeServiceWorker(options: { controller: boolean; waiting?: ServiceWorker }) {
  const registrationListeners = new Map<string, Listener>();
  const containerListeners = new Map<string, Listener>();
  const registration = {
    waiting: options.waiting ?? null,
    installing: null as unknown,
    addEventListener: (type: string, fn: Listener) => registrationListeners.set(type, fn),
  };
  const container = {
    controller: options.controller ? {} : null,
    register: vi.fn(async () => registration),
    addEventListener: (type: string, fn: Listener) => containerListeners.set(type, fn),
    removeEventListener: vi.fn(),
  };
  Object.defineProperty(navigator, 'serviceWorker', { value: container, configurable: true });
  return { container, registration, registrationListeners, containerListeners };
}

beforeEach(() => {
  toast.mockClear();
  vi.stubEnv('NODE_ENV', 'production');
});

afterEach(() => {
  vi.unstubAllEnvs();
  Reflect.deleteProperty(navigator, 'serviceWorker');
});

describe('PwaRegistrar', () => {
  it('does not register outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const { container } = fakeServiceWorker({ controller: false });
    render(<PwaRegistrar />);
    expect(container.register).not.toHaveBeenCalled();
  });

  it('registers /sw.js at scope / in production without any notice on first install', async () => {
    const { container } = fakeServiceWorker({ controller: false });
    render(<PwaRegistrar />);
    await waitFor(() => expect(container.register).toHaveBeenCalledWith('/sw.js', { scope: '/' }));
    expect(toast).not.toHaveBeenCalled();
  });

  it('offers "Atualizar" when a new worker finishes installing, and only reloads once accepted', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    const { registration, registrationListeners, containerListeners } = fakeServiceWorker({ controller: true });
    render(<PwaRegistrar />);
    await waitFor(() => expect(registrationListeners.has('updatefound')).toBe(true));

    const stateListeners = new Map<string, Listener>();
    const worker = {
      state: 'installed',
      postMessage: vi.fn(),
      addEventListener: (type: string, fn: Listener) => stateListeners.set(type, fn),
    };
    registration.installing = worker;
    registrationListeners.get('updatefound')!();
    stateListeners.get('statechange')!();

    expect(toast).toHaveBeenCalledOnce();
    const [message, options] = toast.mock.calls[0] as [string, { action: { label: string; onClick: () => void } }];
    expect(message).toBe('Nova versão disponível');
    expect(options.action.label).toBe('Atualizar');

    // A controller change before the user accepts (e.g. first claim) must not reload.
    containerListeners.get('controllerchange')!();
    expect(reload).not.toHaveBeenCalled();

    options.action.onClick();
    expect(worker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    containerListeners.get('controllerchange')!();
    expect(reload).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });

  it('offers the update straight away when a worker is already waiting', async () => {
    const waiting = { postMessage: vi.fn() } as unknown as ServiceWorker;
    fakeServiceWorker({ controller: true, waiting });
    render(<PwaRegistrar />);
    await waitFor(() => expect(toast).toHaveBeenCalledOnce());
  });
});

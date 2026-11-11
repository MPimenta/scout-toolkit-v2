import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeaturesProvider } from '@/components/providers/FeaturesProvider';
import { InstallProvider } from '@/components/pwa/InstallProvider';
import { InstallEntry } from '@/components/pwa/InstallEntry';
import { INSTALL_DISMISS_KEY } from '@/lib/pwa/install';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';

function setUserAgent(userAgent: string) {
  Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true });
}

function setStandalone(standalone: boolean) {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: standalone,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function renderEntry(flags: Array<'pwa'> = ['pwa']) {
  return render(
    <FeaturesProvider enabled={flags}>
      <InstallProvider>
        <InstallEntry variant="button" />
      </InstallProvider>
    </FeaturesProvider>
  );
}

/** Fires the browser's one-time install event; returns the stub the page will call. */
function fireBeforeInstallPrompt(outcome: 'accepted' | 'dismissed') {
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn(async () => undefined),
    userChoice: Promise.resolve({ outcome }),
  });
  act(() => {
    window.dispatchEvent(event);
  });
  return event;
}

const originalUserAgent = navigator.userAgent;

beforeEach(() => {
  setStandalone(false);
  window.localStorage.clear();
});

afterEach(() => {
  setUserAgent(originalUserAgent);
});

describe('install entry: browsers with an install prompt', () => {
  it('shows nothing until the browser offers the prompt, and never opens anything on load', () => {
    renderEntry();
    expect(screen.queryByRole('button', { name: 'Instalar aplicação' })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the entry once the browser fires beforeinstallprompt, without prompting by itself', () => {
    renderEntry();
    const event = fireBeforeInstallPrompt('accepted');
    expect(screen.getByRole('button', { name: 'Instalar aplicação' })).toBeInTheDocument();
    expect(event.defaultPrevented).toBe(true); // no browser infobar
    expect(event.prompt).not.toHaveBeenCalled();
  });

  it('triggers the browser prompt when asked, then hides the entry', async () => {
    renderEntry();
    const event = fireBeforeInstallPrompt('accepted');
    await userEvent.click(screen.getByRole('button', { name: 'Instalar aplicação' }));
    expect(event.prompt).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Instalar aplicação' })).not.toBeInTheDocument();
    expect(window.localStorage.getItem(INSTALL_DISMISS_KEY)).toBeNull();
  });

  it('remembers a declined prompt', async () => {
    renderEntry();
    fireBeforeInstallPrompt('dismissed');
    await userEvent.click(screen.getByRole('button', { name: 'Instalar aplicação' }));
    await vi.waitFor(() => expect(window.localStorage.getItem(INSTALL_DISMISS_KEY)).not.toBeNull());
  });

  it('stays hidden when a recent dismissal is stored', () => {
    window.localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now() - 1000));
    renderEntry();
    fireBeforeInstallPrompt('accepted');
    expect(screen.queryByRole('button', { name: 'Instalar aplicação' })).not.toBeInTheDocument();
  });

  it('is absent in standalone mode', () => {
    setStandalone(true);
    renderEntry();
    fireBeforeInstallPrompt('accepted');
    expect(screen.queryByRole('button', { name: 'Instalar aplicação' })).not.toBeInTheDocument();
  });

  it('is absent after the app is installed', () => {
    renderEntry();
    fireBeforeInstallPrompt('accepted');
    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });
    expect(screen.queryByRole('button', { name: 'Instalar aplicação' })).not.toBeInTheDocument();
  });

  it('does nothing with the pwa flag off', () => {
    renderEntry([]);
    fireBeforeInstallPrompt('accepted');
    expect(screen.queryByRole('button', { name: 'Instalar aplicação' })).not.toBeInTheDocument();
  });
});

describe('install entry: iOS Safari', () => {
  beforeEach(() => setUserAgent(IPHONE_SAFARI));

  it('offers the entry, but opens no dialog on load', () => {
    renderEntry();
    expect(screen.getByRole('button', { name: 'Instalar aplicação' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the Add to Home Screen steps on request and closes with Escape, remembering it', async () => {
    renderEntry();
    await userEvent.click(screen.getByRole('button', { name: 'Instalar aplicação' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Adicionar ao ecrã principal');

    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(window.localStorage.getItem(INSTALL_DISMISS_KEY)).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Instalar aplicação' })).not.toBeInTheDocument();
  });

  it('is absent when launched from the home screen', () => {
    setStandalone(true);
    renderEntry();
    expect(screen.queryByRole('button', { name: 'Instalar aplicação' })).not.toBeInTheDocument();
  });
});

describe('install entry: menu variant', () => {
  it('runs onActivate (to close the menu) before requesting the install', async () => {
    const order: string[] = [];
    render(
      <FeaturesProvider enabled={['pwa']}>
        <InstallProvider>
          <InstallEntry variant="menu" onActivate={() => order.push('close-menu')} />
        </InstallProvider>
      </FeaturesProvider>
    );
    const event = fireBeforeInstallPrompt('accepted');
    event.prompt.mockImplementation(async () => void order.push('prompt'));
    await userEvent.click(screen.getByRole('button', { name: 'Instalar aplicação' }));
    expect(order).toEqual(['close-menu', 'prompt']);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeaturesProvider } from '@/components/providers/FeaturesProvider';
import { InstallProvider } from '@/components/pwa/InstallProvider';
import { BackControl } from '@/components/pwa/BackControl';

const back = vi.fn();
const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ back, push }) }));

function setStandalone(standalone: boolean) {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: standalone,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

function setHistoryLength(length: number) {
  Object.defineProperty(window.history, 'length', { value: length, configurable: true });
}

function renderControl(flags: Array<'pwa'> = ['pwa']) {
  return render(
    <FeaturesProvider enabled={flags}>
      <InstallProvider>
        <BackControl fallbackHref="/activities" label="Voltar às atividades" />
      </InstallProvider>
    </FeaturesProvider>
  );
}

beforeEach(() => {
  back.mockClear();
  push.mockClear();
  setStandalone(true);
  setHistoryLength(3);
});

afterEach(() => {
  delete document.documentElement.dataset.displayMode;
});

describe('BackControl', () => {
  it('is absent in an ordinary browser tab (the browser has its own back button)', () => {
    setStandalone(false);
    renderControl();
    expect(screen.queryByRole('button', { name: 'Voltar às atividades' })).not.toBeInTheDocument();
  });

  it('is absent when the pwa flag is off, even in standalone mode', () => {
    renderControl([]);
    expect(screen.queryByRole('button', { name: 'Voltar às atividades' })).not.toBeInTheDocument();
  });

  it('goes back in history in standalone mode, so the list is shown as it was left', async () => {
    renderControl();
    await userEvent.click(await screen.findByRole('button', { name: 'Voltar às atividades' }));
    expect(back).toHaveBeenCalledOnce();
    expect(push).not.toHaveBeenCalled();
  });

  it('goes to the list when there is no history (opened from a shortcut)', async () => {
    setHistoryLength(1);
    renderControl();
    await userEvent.click(await screen.findByRole('button', { name: 'Voltar às atividades' }));
    expect(push).toHaveBeenCalledWith('/activities');
    expect(back).not.toHaveBeenCalled();
  });
});

describe('standalone style hook', () => {
  it('marks the document with its display mode when the pwa flag is on', async () => {
    renderControl();
    await screen.findByRole('button', { name: 'Voltar às atividades' });
    expect(document.documentElement.dataset.displayMode).toBe('standalone');
  });

  it('marks a browser tab as browser, and sets nothing when the flag is off', () => {
    setStandalone(false);
    const { unmount } = renderControl();
    expect(document.documentElement.dataset.displayMode).toBe('browser');
    unmount();
    expect(document.documentElement.dataset.displayMode).toBeUndefined();

    renderControl([]);
    expect(document.documentElement.dataset.displayMode).toBeUndefined();
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OfflineView } from '@/components/pwa/OfflineView';

afterEach(() => {
  document.cookie = 'kit-locale=; max-age=0; path=/';
  vi.unstubAllGlobals();
});

describe('OfflineView', () => {
  it('is in Portuguese by default and says what needs a connection', () => {
    render(<OfflineView />);
    expect(screen.getByRole('heading', { name: 'Sem ligação' })).toBeInTheDocument();
    expect(screen.getByText(/Entrar, os programas e as exportações precisam de ligação/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument();
  });

  it('switches to English when the locale cookie says so', async () => {
    document.cookie = 'kit-locale=en; path=/';
    render(<OfflineView />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'No connection' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it.each([
    ['?from=%2Factivities%3Fq%3Dfogo', '/activities?q=fogo'],
    ['', '/home'],
    ['?from=%2F%2Fevil.example', '/home'],
    ['?from=https%3A%2F%2Fevil.example', '/home'],
    ['?from=%2Foffline', '/home'],
  ])('retries towards the requested page (%s -> %s)', async (search, expected) => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, search, assign });
    render(<OfflineView />);
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(assign).toHaveBeenCalledWith(expected);
  });
});

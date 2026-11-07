import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/layout/Footer';
import { LocaleProvider } from '@/components/locale/LocaleProvider';

afterEach(() => {
  vi.useRealTimers();
});

describe('Footer', () => {
  it('shows the current year, not a hard-coded one', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2031-03-01T12:00:00Z'));
    render(
      <LocaleProvider initialLocale="pt">
        <Footer />
      </LocaleProvider>
    );
    expect(screen.getByText(/© 2031 Kit de Atividades/)).toBeInTheDocument();
  });
});

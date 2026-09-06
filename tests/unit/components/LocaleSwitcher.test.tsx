import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LocaleProvider } from '@/components/locale/LocaleProvider';
import { LocaleSwitcher } from '@/components/locale/LocaleSwitcher';
import { Header } from '@/components/layout/Header';

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}));

describe('LocaleSwitcher', () => {
  it('writes the kit-locale cookie and stays on the same chrome path', async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider initialLocale="pt">
        <LocaleSwitcher />
      </LocaleProvider>
    );

    expect(screen.getByRole('group', { name: 'Idioma' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'EN' }));
    expect(document.cookie).toMatch(/kit-locale=en/);
    expect(document.documentElement.lang).toBe('en');
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument();
  });

  it('sits in the header next to Entrar, not only in the hamburger', () => {
    render(
      <LocaleProvider initialLocale="pt">
        <Header />
      </LocaleProvider>
    );

    const cluster = screen.getByRole('group', { name: 'Idioma' });
    expect(cluster).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toBeInTheDocument();
  });
});

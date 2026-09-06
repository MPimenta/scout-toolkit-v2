import { describe, expect, it } from 'vitest';
import { getByPath, getMessages, resolveLocale } from '@/lib/locale/catalog';

describe('locale catalog', () => {
  it('defaults a missing cookie to pt', () => {
    expect(resolveLocale(undefined)).toBe('pt');
    expect(resolveLocale(null)).toBe('pt');
    expect(resolveLocale('fr')).toBe('pt');
  });

  it('resolves kit-locale=en to en', () => {
    expect(resolveLocale('en')).toBe('en');
  });

  it('keeps Kit de Atividades identical in both catalogs', () => {
    expect(getMessages('pt').productName).toBe('Kit de Atividades');
    expect(getMessages('en').productName).toBe('Kit de Atividades');
  });

  it('interpolates catalog placeholders', () => {
    expect(getByPath(getMessages('pt'), 'activities.foundMany', { count: 3 })).toBe(
      '3 atividades encontradas'
    );
    expect(getByPath(getMessages('en'), 'home.explore')).toBe('Explore activities');
  });
});

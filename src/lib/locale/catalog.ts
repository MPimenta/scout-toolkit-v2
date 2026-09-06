import en from '@/messages/en.json';
import pt from '@/messages/pt.json';

export const LOCALE_COOKIE = 'kit-locale';
export const LOCALES = ['pt', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export type Messages = typeof pt;

const catalogs: Record<Locale, Messages> = { pt, en };

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'pt' || value === 'en';
}

export function resolveLocale(value?: string | null): Locale {
  return isLocale(value) ? value : 'pt';
}

export function getMessages(locale?: string | null): Messages {
  return catalogs[resolveLocale(locale)];
}

export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match
  );
}

export function getByPath(
  messages: Messages,
  path: string,
  vars?: Record<string, string | number>
): string {
  const parts = path.split('.');
  let current: unknown = messages;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? interpolate(current, vars) : path;
}

export type Translate = (path: string, vars?: Record<string, string | number>) => string;

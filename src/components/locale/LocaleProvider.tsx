'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LOCALE_COOKIE,
  type Locale,
  type Messages,
  type Translate,
  getByPath,
  getMessages,
  resolveLocale,
} from '@/lib/locale/catalog';

type LocaleContextValue = {
  locale: Locale;
  messages: Messages;
  t: Translate;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const fallbackMessages = getMessages('pt');
const fallbackT: Translate = (path, vars) => getByPath(fallbackMessages, path, vars);

function writeLocaleCookie(locale: Locale) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(resolveLocale(initialLocale));

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    const resolved = resolveLocale(next);
    writeLocaleCookie(resolved);
    setLocaleState(resolved);
    router.refresh();
  }, [router]);

  const value = useMemo<LocaleContextValue>(() => {
    const messages = getMessages(locale);
    return {
      locale,
      messages,
      t: (path, vars) => getByPath(messages, path, vars),
      setLocale,
    };
  }, [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    return {
      locale: 'pt' as Locale,
      messages: fallbackMessages,
      t: fallbackT,
      setLocale: () => undefined,
    };
  }
  return context;
}

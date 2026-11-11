'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { safeReturnPath } from '@/lib/pwa/return-path';
import { LOCALE_COOKIE, getMessages, resolveLocale, type Locale } from '@/lib/locale/catalog';

/**
 * The page the service worker redirects to when a navigation fails (`/offline?from=<path>`).
 * It is stored without cookies, so it renders in Portuguese and switches to the stored
 * locale on the client. Retrying goes back to the page the user was heading to.
 */
export function OfflineView() {
  const [locale, setLocale] = useState<Locale>('pt');

  useEffect(() => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
    setLocale(resolveLocale(match?.[1]));
  }, []);

  const offline = getMessages(locale).offline;

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <WifiOff className="h-12 w-12 text-primary" aria-hidden="true" />
      <h1 className="text-2xl font-bold">{offline.title}</h1>
      <p className="text-muted-foreground">{offline.body}</p>
      <Button onClick={() => window.location.assign(safeReturnPath(new URLSearchParams(window.location.search).get('from')))}>{offline.retry}</Button>
    </div>
  );
}

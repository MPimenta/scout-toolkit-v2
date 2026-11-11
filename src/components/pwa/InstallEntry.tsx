'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/components/locale/LocaleProvider';
import { useInstall } from '@/components/pwa/InstallProvider';

/**
 * "Instalar aplicação". Renders nothing unless the app can be installed and is not
 * installed already. `menu` is the full-width row in the phone menu; `button` is for pages.
 */
export function InstallEntry({
  variant,
  onActivate,
}: {
  variant: 'menu' | 'button';
  /** Runs before the install request (e.g. to close the menu first). */
  onActivate?: () => void;
}) {
  const { mode, requestInstall } = useInstall();
  const { t } = useLocale();
  if (!mode) return null;

  const activate = () => {
    onActivate?.();
    requestInstall();
  };

  if (variant === 'menu') {
    return (
      <button
        type="button"
        onClick={activate}
        className="min-h-11 flex w-full items-center gap-2 px-3 rounded-md text-left text-base font-bold hover:bg-muted"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        {t('install.action')}
      </button>
    );
  }

  return (
    <Button type="button" variant="outline" onClick={activate}>
      <Download aria-hidden="true" />
      {t('install.action')}
    </Button>
  );
}

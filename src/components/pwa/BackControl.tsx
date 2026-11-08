'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useInstall } from '@/components/pwa/InstallProvider';

/**
 * A back button for pages the browser's own back button normally covers. It only shows when
 * the app runs in its own window (installed), where that button is missing. It goes back in
 * history, so the list is shown as it was left (the catalogue restores its filters); with
 * nothing to go back to (opened from a shortcut) it goes to `fallbackHref`.
 */
export function BackControl({ fallbackHref, label }: { fallbackHref: string; label: string }) {
  const { standalone } = useInstall();
  const router = useRouter();
  if (!standalone) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      className="-ml-3 min-h-11"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
    >
      <ArrowLeft aria-hidden="true" />
      {label}
    </Button>
  );
}

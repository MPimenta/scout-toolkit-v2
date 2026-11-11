'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useLocale } from '@/components/locale/LocaleProvider';
import { useTrackAppLaunch } from '@/hooks/useUsageTracking';

/**
 * Registers the service worker (production only, rendered when the pwa flag is on)
 * and offers "Atualizar" when a new version is waiting. Never reloads by itself: an
 * open admin form could hold unsaved input.
 */
export function PwaRegistrar() {
  const { t } = useLocale();
  useTrackAppLaunch();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;

    const container = navigator.serviceWorker;
    let accepted = false;
    // The first install also claims the page (controllerchange); only reload for a user-accepted update.
    const onControllerChange = () => {
      if (accepted) window.location.reload();
    };
    container.addEventListener('controllerchange', onControllerChange);

    const offerUpdate = (worker: ServiceWorker) => {
      toast(t('pwa.updateAvailable'), {
        duration: Infinity,
        action: {
          label: t('pwa.update'),
          onClick: () => {
            accepted = true;
            worker.postMessage({ type: 'SKIP_WAITING' });
          },
        },
      });
    };

    container
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        if (registration.waiting && container.controller) offerUpdate(registration.waiting);
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && container.controller) offerUpdate(worker);
          });
        });
      })
      .catch(() => {
        // Registration is an enhancement; the site works without it.
      });

    return () => container.removeEventListener('controllerchange', onControllerChange);
  }, [t]);

  return null;
}

'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Share } from 'lucide-react';
import { useFeature } from '@/components/providers/FeaturesProvider';
import { useLocale } from '@/components/locale/LocaleProvider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { isIosSafari, isStandalone, readDismissal, writeDismissal } from '@/lib/pwa/install';

/** `beforeinstallprompt` is not in the DOM typings (Chromium only). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** `prompt`: the browser has an install prompt. `ios`: show the Add to Home Screen steps. `null`: offer nothing. */
export type InstallMode = 'prompt' | 'ios' | null;

interface InstallContextValue {
  mode: InstallMode;
  requestInstall: () => void;
}

const InstallContext = createContext<InstallContextValue>({ mode: null, requestInstall: () => undefined });

/** What the install entries need. Inert (nothing to offer) outside the provider or with the flag off. */
export function useInstall(): InstallContextValue {
  return useContext(InstallContext);
}

function getStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Owns the install state for the whole app. It listens from page load, because the phone
 * menu only mounts when opened and would miss the browser's one-time event. It never opens
 * anything by itself: the dialog appears only after the user asks.
 */
export function InstallProvider({ children }: { children: React.ReactNode }) {
  const enabled = useFeature('pwa');
  const { t } = useLocale();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [iosOpen, setIosOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    setStandalone(isStandalone(window));
    setIos(isIosSafari(navigator));
    setDismissed(readDismissal(getStorage()));

    const onBeforeInstall = (event: Event) => {
      event.preventDefault(); // no browser mini-infobar: the user asks from the menu
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setStandalone(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [enabled]);

  const dismiss = useCallback(() => {
    writeDismissal(getStorage());
    setDismissed(true);
  }, []);

  const mode: InstallMode = !enabled || standalone || dismissed ? null : deferred ? 'prompt' : ios ? 'ios' : null;

  const requestInstall = useCallback(() => {
    if (mode === 'ios') {
      setIosOpen(true);
      return;
    }
    if (mode !== 'prompt' || !deferred) return;
    setDeferred(null); // a captured event can be used once
    void deferred
      .prompt()
      .then(() => deferred.userChoice)
      .then((choice) => {
        if (choice.outcome === 'dismissed') dismiss();
      })
      .catch(() => undefined);
  }, [mode, deferred, dismiss]);

  const value = useMemo(() => ({ mode, requestInstall }), [mode, requestInstall]);

  return (
    <InstallContext.Provider value={value}>
      {children}
      {enabled && (
        <Dialog
          open={iosOpen}
          onOpenChange={(open) => {
            setIosOpen(open);
            if (!open) dismiss();
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('install.action')}</DialogTitle>
              <DialogDescription>{t('install.iosLead')}</DialogDescription>
            </DialogHeader>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                {t('install.iosStep1')} <Share className="inline h-4 w-4 align-text-bottom" aria-hidden="true" />
              </li>
              <li>{t('install.iosStep2')}</li>
              <li>{t('install.iosStep3')}</li>
            </ol>
            <DialogFooter>
              <DialogClose asChild>
                <Button>{t('install.close')}</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </InstallContext.Provider>
  );
}

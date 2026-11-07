/**
 * Install-experience helpers (openspec: mobile-pwa, "Users can install the app without
 * being nagged"). Pure functions so each state can be unit-tested.
 */

export const INSTALL_DISMISS_KEY = 'kit-install-dismissed';
/** A dismissal (declined prompt, or closed iOS instructions) is honoured for this long. */
export const INSTALL_DISMISS_DAYS = 30;

type DisplayModeWindow = {
  matchMedia?: (query: string) => { matches: boolean };
  /** Safari adds a non-standard `standalone` flag to its Navigator. */
  navigator?: object;
};

/** True when the app runs as an installed app (Android display-mode, or iOS `navigator.standalone`). */
export function isStandalone(win: DisplayModeWindow): boolean {
  try {
    if (win.matchMedia?.('(display-mode: standalone)').matches) return true;
  } catch {
    // matchMedia unavailable: fall through to the iOS flag.
  }
  return (win.navigator as { standalone?: boolean } | undefined)?.standalone === true;
}

type NavigatorLike = { userAgent: string; platform?: string; maxTouchPoints?: number };

/** iPhone/iPad Safari itself: other iOS browsers and in-app web views have no "Add to Home Screen" path we describe. */
export function isIosSafari(nav: NavigatorLike): boolean {
  const ua = nav.userAgent;
  // iPadOS 13+ reports itself as a Mac, but has a touch screen.
  const ios = /iPhone|iPad|iPod/.test(ua) || (nav.platform === 'MacIntel' && (nav.maxTouchPoints ?? 0) > 1);
  if (!ios) return false;
  const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|GSA\/|FBAN|FBAV|Instagram|Line\//.test(ua);
  return /Safari\//.test(ua) && !otherBrowser;
}

type ReadableStorage = Pick<Storage, 'getItem'>;
type WritableStorage = Pick<Storage, 'setItem'>;

/** True while a remembered dismissal is still fresh. Storage can throw (private windows): then nothing is remembered. */
export function readDismissal(storage: ReadableStorage | null, now: number = Date.now()): boolean {
  try {
    const stored = Number(storage?.getItem(INSTALL_DISMISS_KEY));
    return Number.isFinite(stored) && stored > 0 && now - stored < INSTALL_DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function writeDismissal(storage: WritableStorage | null, now: number = Date.now()): void {
  try {
    storage?.setItem(INSTALL_DISMISS_KEY, String(now));
  } catch {
    // Not remembered; the entry simply stays available.
  }
}

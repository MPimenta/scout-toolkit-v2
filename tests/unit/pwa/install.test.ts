import { describe, expect, it } from 'vitest';
import {
  INSTALL_DISMISS_DAYS,
  INSTALL_DISMISS_KEY,
  isIosSafari,
  isStandalone,
  readDismissal,
  writeDismissal,
} from '@/lib/pwa/install';

const DAY = 24 * 60 * 60 * 1000;

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.0.0 Mobile/15E148 Safari/604.1';
const IPHONE_FACEBOOK =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/450.0]';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';
const MAC_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';

describe('isStandalone', () => {
  it('is true for the standalone display mode', () => {
    expect(isStandalone({ matchMedia: () => ({ matches: true }) })).toBe(true);
  });

  it('is true for iOS navigator.standalone', () => {
    expect(isStandalone({ matchMedia: () => ({ matches: false }), navigator: { standalone: true } })).toBe(true);
  });

  it('is false in a normal browser tab', () => {
    expect(isStandalone({ matchMedia: () => ({ matches: false }), navigator: {} })).toBe(false);
    expect(isStandalone({})).toBe(false);
  });

  it('survives a throwing matchMedia', () => {
    expect(
      isStandalone({
        matchMedia: () => {
          throw new Error('nope');
        },
      })
    ).toBe(false);
  });
});

describe('isIosSafari', () => {
  it('recognises iPhone Safari', () => {
    expect(isIosSafari({ userAgent: IPHONE_SAFARI })).toBe(true);
  });

  it('recognises iPad Safari that reports itself as a Mac', () => {
    expect(isIosSafari({ userAgent: MAC_SAFARI, platform: 'MacIntel', maxTouchPoints: 5 })).toBe(true);
  });

  it('rejects a real Mac without touch', () => {
    expect(isIosSafari({ userAgent: MAC_SAFARI, platform: 'MacIntel', maxTouchPoints: 0 })).toBe(false);
  });

  it('rejects other iOS browsers and in-app web views', () => {
    expect(isIosSafari({ userAgent: IPHONE_CHROME })).toBe(false);
    expect(isIosSafari({ userAgent: IPHONE_FACEBOOK })).toBe(false);
  });

  it('rejects Android', () => {
    expect(isIosSafari({ userAgent: ANDROID_CHROME })).toBe(false);
  });
});

describe('dismissal', () => {
  const store = (value: string | null) => ({ getItem: () => value });

  it('is false when nothing was stored or storage is unavailable', () => {
    expect(readDismissal(store(null))).toBe(false);
    expect(readDismissal(null)).toBe(false);
  });

  it('is true while fresh and false once it has expired', () => {
    const now = 1_000 * DAY;
    expect(readDismissal(store(String(now - DAY)), now)).toBe(true);
    expect(readDismissal(store(String(now - (INSTALL_DISMISS_DAYS + 1) * DAY)), now)).toBe(false);
  });

  it('ignores garbage values', () => {
    expect(readDismissal(store('yes'))).toBe(false);
  });

  it('does not throw when storage throws', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readDismissal(blocked)).toBe(false);
    expect(() => writeDismissal(blocked)).not.toThrow();
  });

  it('writes a timestamp under the install key', () => {
    const saved: Record<string, string> = {};
    writeDismissal({ setItem: (key, value) => void (saved[key] = value) }, 1234);
    expect(saved).toEqual({ [INSTALL_DISMISS_KEY]: '1234' });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deliverFile } from '@/lib/export/deliver-file';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36';
const originalUserAgent = navigator.userAgent;

type ShareBehaviour = 'ok' | 'abort' | 'fail' | 'none';

function setEnvironment(options: { userAgent: string; standalone: boolean; share?: ShareBehaviour }) {
  Object.defineProperty(navigator, 'userAgent', { value: options.userAgent, configurable: true });
  window.matchMedia = vi.fn().mockImplementation(() => ({ matches: options.standalone })) as unknown as typeof window.matchMedia;
  const share = vi.fn(async (_data: ShareData) => {
    if (options.share === 'abort') throw new DOMException('cancelled', 'AbortError');
    if (options.share === 'fail') throw new DOMException('nope', 'NotAllowedError');
  });
  if (options.share === 'none') {
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  } else {
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
  }
  return share;
}

const blob = new Blob(['x'], { type: 'application/pdf' });
let click: ReturnType<typeof vi.fn>;

beforeEach(() => {
  click = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(click as () => void);
  window.URL.createObjectURL = vi.fn(() => 'blob:x');
  window.URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(navigator, 'userAgent', { value: originalUserAgent, configurable: true });
});

describe('deliverFile', () => {
  it('downloads with an anchor in an ordinary browser', async () => {
    const share = setEnvironment({ userAgent: ANDROID, standalone: false });
    await deliverFile(blob, 'programa.pdf');
    expect(click).toHaveBeenCalledOnce();
    expect(share).not.toHaveBeenCalled();
  });

  it('downloads with an anchor in the installed Android app', async () => {
    const share = setEnvironment({ userAgent: ANDROID, standalone: true });
    await deliverFile(blob, 'programa.pdf');
    expect(click).toHaveBeenCalledOnce();
    expect(share).not.toHaveBeenCalled();
  });

  it('uses the share sheet in the installed iOS app', async () => {
    const share = setEnvironment({ userAgent: IPHONE, standalone: true, share: 'ok' });
    await deliverFile(blob, 'programa.pdf');
    expect(share).toHaveBeenCalledOnce();
    const data = share.mock.calls[0]![0] as { files: File[]; title: string };
    expect(data.files[0]!.name).toBe('programa.pdf');
    expect(click).not.toHaveBeenCalled();
  });

  it('treats closing the share sheet as done, not as an error', async () => {
    setEnvironment({ userAgent: IPHONE, standalone: true, share: 'abort' });
    await expect(deliverFile(blob, 'programa.pdf')).resolves.toBeUndefined();
    expect(click).not.toHaveBeenCalled();
  });

  it('falls back to a download when sharing fails or is unavailable', async () => {
    setEnvironment({ userAgent: IPHONE, standalone: true, share: 'fail' });
    await deliverFile(blob, 'a.pdf');
    expect(click).toHaveBeenCalledTimes(1);

    setEnvironment({ userAgent: IPHONE, standalone: true, share: 'none' });
    await deliverFile(blob, 'b.pdf');
    expect(click).toHaveBeenCalledTimes(2);
  });

  it('keeps the normal download in iOS Safari tabs', async () => {
    const share = setEnvironment({ userAgent: IPHONE, standalone: false, share: 'ok' });
    await deliverFile(blob, 'programa.pdf');
    expect(click).toHaveBeenCalledOnce();
    expect(share).not.toHaveBeenCalled();
  });
});

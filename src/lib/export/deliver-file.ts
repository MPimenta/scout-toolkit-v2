import { isStandalone } from '@/lib/pwa/install';

type NavigatorWithShare = Navigator & {
  canShare?: (data: ShareData) => boolean;
  share?: (data: ShareData) => Promise<void>;
};

function isIos(nav: Navigator): boolean {
  return /iPhone|iPad|iPod/.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
}

/** Starts a normal browser download of a blob. */
function downloadWithAnchor(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Hands an exported file (Excel, PDF) to the user.
 *
 * In the installed iPhone/iPad app, downloading a blob through `<a download>` is unreliable
 * (it can leave a blank page or do nothing), so the file goes through the system share sheet,
 * which offers "Save to Files". Everywhere else, and when sharing is not possible, it is an
 * ordinary download. Closing the share sheet is not an error.
 */
export async function deliverFile(blob: Blob, filename: string): Promise<void> {
  const nav = window.navigator as NavigatorWithShare;
  if (isStandalone(window) && isIos(nav) && nav.canShare && nav.share) {
    const file = new File([blob], filename, { type: blob.type });
    if (nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: filename });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        // Sharing failed for another reason: fall back to a download.
      }
    }
  }
  downloadWithAnchor(blob, filename);
}

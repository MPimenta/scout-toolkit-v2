import { NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/lib/features';
import { buildManifest } from '@/lib/pwa/manifest';

// A route handler rather than `app/manifest.ts`: the file convention always injects
// <link rel="manifest">, and with the `pwa` flag off the page must not link one.
export const dynamic = 'force-dynamic';

export function GET() {
  if (!isFeatureEnabled('pwa')) return new NextResponse(null, { status: 404 });
  return NextResponse.json(buildManifest(), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

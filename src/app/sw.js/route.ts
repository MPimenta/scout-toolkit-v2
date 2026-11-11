import { NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/lib/features';
import { buildKillSwitchSource, buildWorkerSource } from '@/lib/pwa/sw-source';

// A route handler rather than public/sw.js so the pwa flag can swap in the
// self-unregistering worker without a deploy (design.md). Always reachable.
export const dynamic = 'force-dynamic';

export function GET() {
  const body = isFeatureEnabled('pwa') ? buildWorkerSource() : buildKillSwitchSource();
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/javascript; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Service-Worker-Allowed': '/',
    },
  });
}

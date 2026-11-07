import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { featureGate } from '@/lib/feature-gate';

/**
 * Hides switched-off features (src/lib/features.ts): their pages show the 404 page
 * and their APIs answer 404. `/` → `/home` is handled by src/app/page.tsx.
 */
export function middleware(request: NextRequest) {
  return featureGate(request) ?? NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)'],
};

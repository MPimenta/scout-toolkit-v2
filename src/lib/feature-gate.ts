import { NextResponse, type NextRequest } from 'next/server';
import { getEnabledFeatures, isFeatureEnabled, isPathHidden, type FeatureFlag } from '@/lib/features';

/** Path that has no page, so a rewrite to it renders the standard 404 page with status 404. */
export const HIDDEN_FEATURE_PAGE = '/__feature-off';

function notFoundJson() {
  return NextResponse.json(
    { error: { code: 'NOT_FOUND', message: 'Recurso não encontrado' } },
    { status: 404 }
  );
}

/**
 * Handler-level guard for endpoints middleware cannot tell apart by path
 * (e.g. POST /api/activities). Returns a 404 response when the flag is off.
 */
export function featureOffResponse(flag: FeatureFlag): NextResponse | null {
  return isFeatureEnabled(flag) ? null : notFoundJson();
}

/**
 * Returns a 404 response when the request targets a feature that is switched off,
 * or null to let the request through. API routes get the standard JSON error shape.
 */
export function featureGate(
  request: NextRequest,
  enabled: Set<FeatureFlag> = getEnabledFeatures()
): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (!isPathHidden(pathname, enabled)) return null;

  if (pathname.startsWith('/api/')) return notFoundJson();
  return NextResponse.rewrite(new URL(HIDDEN_FEATURE_PAGE, request.url), { status: 404 });
}

import { NextResponse } from 'next/server';
import { featureOffResponse } from '@/lib/feature-gate';
import { TRACKING_OFF_COOKIE } from '@/lib/usage/guard';
import { VISITOR_COOKIE } from '@/lib/usage/visitor';

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * @swagger
 * /api/usage/opt-out:
 *   post:
 *     summary: Turn usage tracking off for this browser (removes the visitor id)
 *     tags: [Usage]
 *   delete:
 *     summary: Turn usage tracking back on for this browser
 *     tags: [Usage]
 */
export async function POST() {
  const hidden = featureOffResponse('usage-tracking');
  if (hidden) return hidden;
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(TRACKING_OFF_COOKIE, '1', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: ONE_YEAR });
  response.cookies.delete(VISITOR_COOKIE);
  return response;
}

export async function DELETE() {
  const hidden = featureOffResponse('usage-tracking');
  if (hidden) return hidden;
  const response = new NextResponse(null, { status: 204 });
  response.cookies.delete(TRACKING_OFF_COOKIE);
  return response;
}

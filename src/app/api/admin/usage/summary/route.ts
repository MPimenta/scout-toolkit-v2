import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/auth/utils';
import { apiErrors, withApiErrorHandler } from '@/lib/errors';
import { featureOffResponse } from '@/lib/feature-gate';
import { AGE_GROUP_VALUES } from '@/lib/activities/category-values';
import { getUsageSummary, USAGE_PERIODS } from '@/lib/usage/analytics';

const querySchema = z.object({
  period: z.enum(USAGE_PERIODS).default('30d'),
  division: z.enum(AGE_GROUP_VALUES).optional(),
});

/**
 * @swagger
 * /api/admin/usage/summary:
 *   get:
 *     summary: Usage figures for administrators
 *     description: Totals, evolution, top activities (viewed vs added to programs), searches, searches
 *       without results and most active users. Admin only; behind the usage-tracking flag.
 *     tags: [Admin]
 *     parameters:
 *       - { in: query, name: period, schema: { type: string, enum: ['7d', '30d', '90d', '13m'] } }
 *       - { in: query, name: division, schema: { type: string } }
 *     responses:
 *       200: { description: Summary }
 *       400: { description: Invalid period or division }
 *       401: { description: Not signed in }
 *       403: { description: Not an administrator }
 *       404: { description: Tracking is off }
 */
export const GET = withApiErrorHandler(async (request: NextRequest) => {
  const hidden = featureOffResponse('usage-tracking');
  if (hidden) return hidden;

  const gate = await requireAdminApi();
  if (gate.error) return gate.error;

  const params = request.nextUrl.searchParams;
  const parsed = querySchema.safeParse({
    period: params.get('period') ?? undefined,
    division: params.get('division') || undefined,
  });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path.join('.') || 'period';
    return apiErrors.validation(field, 'Período ou divisão inválidos');
  }

  return NextResponse.json(await getUsageSummary(parsed.data.period, parsed.data.division ?? null));
});

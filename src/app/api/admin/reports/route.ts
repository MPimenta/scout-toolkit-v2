import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { issueReports, user } from '../../../../../drizzle/schema';
import { requireAdminApi } from '@/lib/auth/utils';
import { withApiErrorHandler } from '@/lib/errors';

export const GET = withApiErrorHandler(async (request: NextRequest) => {
  const gate = await requireAdminApi();
  if (gate.error) return gate.error;

  const status = new URL(request.url).searchParams.get('status');
  const rows = status === 'aberto'
    ? await db
        .select({
          id: issueReports.id,
          kind: issueReports.kind,
          message: issueReports.message,
          contact_email: issueReports.contact_email,
          path: issueReports.path,
          locale: issueReports.locale,
          viewport: issueReports.viewport,
          user_id: issueReports.user_id,
          status: issueReports.status,
          created_at: issueReports.created_at,
          closed_at: issueReports.closed_at,
          user_name: user.name,
          user_email: user.email,
        })
        .from(issueReports)
        .leftJoin(user, eq(issueReports.user_id, user.id))
        .where(eq(issueReports.status, 'aberto'))
        .orderBy(desc(issueReports.created_at))
    : await db
        .select({
          id: issueReports.id,
          kind: issueReports.kind,
          message: issueReports.message,
          contact_email: issueReports.contact_email,
          path: issueReports.path,
          locale: issueReports.locale,
          viewport: issueReports.viewport,
          user_id: issueReports.user_id,
          status: issueReports.status,
          created_at: issueReports.created_at,
          closed_at: issueReports.closed_at,
          user_name: user.name,
          user_email: user.email,
        })
        .from(issueReports)
        .leftJoin(user, eq(issueReports.user_id, user.id))
        .orderBy(desc(issueReports.created_at));

  return NextResponse.json({ reports: rows });
});

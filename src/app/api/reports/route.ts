import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/server';
import { issueReports } from '../../../../drizzle/schema';
import { auth } from '@/lib/auth/config';
import { notifyAdmins } from '@/lib/suggestions';
import {
  allowReport,
  GUEST_REPORT_LIMIT,
  parseIssueReportBody,
  reportClientKey,
  SIGNED_IN_REPORT_LIMIT,
} from '@/lib/reports';
import { apiErrors, withApiErrorHandler } from '@/lib/errors';

export const POST = withApiErrorHandler(async (request: NextRequest) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiErrors.validation('body', 'Corpo da requisição inválido');
  }

  const parsed = parseIssueReportBody(body);
  if (typeof parsed === 'string') {
    return apiErrors.validation('body', parsed);
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const key = reportClientKey(request, userId);
  const limit = userId ? SIGNED_IN_REPORT_LIMIT : GUEST_REPORT_LIMIT;
  if (!allowReport(key, limit)) {
    return NextResponse.json(
      { error: { code: 'RATE_LIMIT', message: 'Demasiados reportes. Tenta mais tarde.' } },
      { status: 429 }
    );
  }

  const [row] = await db
    .insert(issueReports)
    .values({
      kind: parsed.kind,
      message: parsed.message,
      contact_email: parsed.contact_email,
      path: parsed.path,
      locale: parsed.locale,
      viewport: parsed.viewport,
      user_id: userId,
    })
    .returning();

  await notifyAdmins(
    'Novo reporte',
    parsed.message.slice(0, 140),
    '/admin/reportes',
    'issue_report'
  );

  return NextResponse.json({ report: row }, { status: 201 });
});

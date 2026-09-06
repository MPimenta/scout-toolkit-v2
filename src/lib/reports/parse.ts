import { ISSUE_REPORT_KINDS } from '../../../drizzle/schema/feedback';

export type ParsedIssueReport = {
  kind: (typeof ISSUE_REPORT_KINDS)[number];
  message: string;
  contact_email: string | null;
  path: string;
  locale: 'pt' | 'en';
  viewport: string;
};

const KIND_SET = new Set<string>(ISSUE_REPORT_KINDS);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseIssueReportBody(body: unknown): ParsedIssueReport | string {
  if (!body || typeof body !== 'object') {
    return 'Corpo da requisição inválido';
  }

  const data = body as Record<string, unknown>;
  const kind = typeof data.kind === 'string' ? data.kind : '';
  if (!KIND_SET.has(kind)) {
    return 'Tipo de reporte inválido';
  }

  const message = typeof data.message === 'string' ? data.message.trim() : '';
  if (message.length < 10) {
    return 'A mensagem deve ter pelo menos 10 caracteres';
  }
  if (message.length > 2000) {
    return 'A mensagem é demasiado longa';
  }

  let contact_email: string | null = null;
  if (data.contact_email != null && data.contact_email !== '') {
    if (typeof data.contact_email !== 'string' || !EMAIL.test(data.contact_email.trim())) {
      return 'Email de contacto inválido';
    }
    contact_email = data.contact_email.trim();
  }

  const rawPath = typeof data.path === 'string' ? data.path.trim() : '';
  const path = (rawPath.startsWith('/') ? rawPath : `/${rawPath}`).slice(0, 500) || '/';
  const locale = data.locale === 'en' ? 'en' : 'pt';
  const viewport =
    typeof data.viewport === 'string' && data.viewport.trim()
      ? data.viewport.trim().slice(0, 32)
      : 'unknown';

  return {
    kind: kind as ParsedIssueReport['kind'],
    message,
    contact_email,
    path,
    locale,
    viewport,
  };
}

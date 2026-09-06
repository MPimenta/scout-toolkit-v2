import { describe, expect, it } from 'vitest';
import { parseIssueReportBody } from '@/lib/reports/parse';

describe('parseIssueReportBody', () => {
  it('accepts a valid guest report', () => {
    expect(parseIssueReportBody({
      kind: 'ideia',
      message: 'O filtro de idade não aparece.',
      path: '/activities',
      locale: 'pt',
      viewport: '390x844',
    })).toEqual({
      kind: 'ideia',
      message: 'O filtro de idade não aparece.',
      contact_email: null,
      path: '/activities',
      locale: 'pt',
      viewport: '390x844',
    });
  });

  it('rejects a short message', () => {
    expect(parseIssueReportBody({
      kind: 'incidente',
      message: 'curto',
      path: '/activities',
      locale: 'pt',
      viewport: '800x600',
    })).toBe('A mensagem deve ter pelo menos 10 caracteres');
  });

  it('ignores a client-supplied user id', () => {
    const parsed = parseIssueReportBody({
      kind: 'conteudo',
      message: 'Texto da atividade está errado.',
      path: '/activities/abc',
      locale: 'en',
      viewport: '1280x720',
      user_id: 'forged-id',
    });
    expect(parsed).toMatchObject({ kind: 'conteudo', locale: 'en' });
    expect(parsed).not.toHaveProperty('user_id');
  });
});

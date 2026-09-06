import { describe, expect, it } from 'vitest';
import pt from '@/messages/pt.json';
import en from '@/messages/en.json';

describe('report and view-as copy', () => {
  it('uses the specified Portuguese labels by default', () => {
    expect(pt.report.action).toBe('Reportar');
    expect(pt.report.success).toBe('Obrigado. Recebemos o teu reporte.');
    expect(pt.report.kindIncident).toBe('Incidente');
    expect(pt.report.kindContent).toBe('Conteúdo');
    expect(pt.report.kindIdea).toBe('Ideia');
    expect(pt.admin.viewAsMember).toBe('Ver como membro');
    expect(pt.admin.viewingAsMember).toBe('A ver como membro');
    expect(pt.admin.backToAdmin).toBe('Voltar à vista de admin');
  });

  it('keeps the English switcher labels', () => {
    expect(en.report.action).toBe('Report');
    expect(en.admin.viewAsMember).toBe('View as member');
    expect(en.admin.backToAdmin).toBe('Back to admin view');
  });
});

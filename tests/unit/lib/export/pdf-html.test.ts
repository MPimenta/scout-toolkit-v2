import { describe, it, expect } from 'vitest';
import { generateProgramPDFHTML } from '@/lib/export/pdf-html';
import type { ProgramForExport } from '@/lib/export/types';

const sampleProgram: ProgramForExport = {
  id: '550e8400-e29b-41d4-a716-446655440099',
  name: 'Acampamento <script>alert(1)</script>',
  date: '2026-04-12',
  start_time: '09:00:00',
  is_public: false,
  user_id: '550e8400-e29b-41d4-a716-446655440000',
  created_at: '2026-04-01T10:00:00.000Z',
  updated_at: '2026-04-01T10:00:00.000Z',
  user: { name: 'Chefe Ana' },
  entries: [
    {
      id: 'e1',
      position: 1,
      start_time: '09:00:00',
      end_time: '09:45:00',
      entry_type: 'activity',
      custom_title: null,
      custom_duration_minutes: null,
      activity: {
        id: 'a1',
        name: 'Jogo da Bandeira',
        description: 'Jogo de perseguição',
        materials: 'Bandeiras',
        approximate_duration_minutes: 45,
        group_size: 'medium',
        effort_level: 'high',
        location: 'outside',
        activityType: { name: 'Jogo' },
        educationalGoals: [{ code: 'F1', title: 'Cooperação' }],
        sdgs: [{ number: 4, name: 'Educação de qualidade' }],
      },
    },
  ],
};

describe('generateProgramPDFHTML', () => {
  it('renders a print-optimized Portuguese summary and schedule', () => {
    const html = generateProgramPDFHTML(sampleProgram);

    expect(html).toContain('lang="pt-PT"');
    expect(html).toContain('@media print');
    expect(html).toContain('Cronograma do Programa');
    expect(html).toContain('Resumo do Programa');
    expect(html).toContain('Jogo da Bandeira');
    expect(html).toContain('F1 Cooperação');
    expect(html).toContain('ODS 4: Educação de qualidade');
    expect(html).toContain('Médio (7-15)');
    expect(html).toContain('Exterior');
    expect(html).toContain('Escoteiros de Portugal');
  });

  it('escapes HTML in program names', () => {
    const html = generateProgramPDFHTML(sampleProgram);

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('Acampamento &lt;script&gt;alert(1)&lt;/script&gt;');
  });
});

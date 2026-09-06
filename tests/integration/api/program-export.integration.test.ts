import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import type { ProgramForExport } from '@/lib/export/types';

const OWNER_ID = '550e8400-e29b-41d4-a716-446655440000';
const PROGRAM_ID = '550e8400-e29b-41d4-a716-446655440099';

const mockAuth = vi.fn();
const mockLoadProgramForExport = vi.fn();
const mockSetContent = vi.fn();
const mockPdf = vi.fn();
const mockClose = vi.fn();
const mockLaunch = vi.fn();

vi.mock('@/lib/auth/config', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/export/load-program', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/export/load-program')>();
  return {
    ...actual,
    loadProgramForExport: (...args: unknown[]) => mockLoadProgramForExport(...args),
  };
});

vi.mock('playwright', () => ({
  chromium: {
    launch: (...args: unknown[]) => mockLaunch(...args),
  },
}));

const sampleProgram: ProgramForExport = {
  id: PROGRAM_ID,
  name: 'Acampamento de Primavera',
  date: '2026-04-12',
  start_time: '09:00:00',
  is_public: false,
  user_id: OWNER_ID,
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

function requestFor(path: string) {
  return new NextRequest(`http://localhost:3000${path}`);
}

describe('Program export APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: OWNER_ID, name: 'Chefe Ana' } });
    mockLoadProgramForExport.mockResolvedValue(sampleProgram);
    mockPdf.mockResolvedValue(Buffer.from('%PDF-1.4 fake'));
    mockLaunch.mockResolvedValue({
      newPage: async () => ({
        setContent: mockSetContent,
        pdf: mockPdf,
      }),
      close: mockClose,
    });
  });

  describe('GET /api/programs/[id]/export/excel', () => {
    it('returns 401 when the user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);
      const { GET } = await import('@/app/api/programs/[id]/export/excel/route');

      const response = await GET(requestFor(`/api/programs/${PROGRAM_ID}/export/excel`), {
        params: Promise.resolve({ id: PROGRAM_ID }),
      });

      expect(response.status).toBe(401);
    });

    it('returns 400 for an invalid program id', async () => {
      const { GET } = await import('@/app/api/programs/[id]/export/excel/route');

      const response = await GET(requestFor('/api/programs/not-a-uuid/export/excel'), {
        params: Promise.resolve({ id: 'not-a-uuid' }),
      });

      expect(response.status).toBe(400);
    });

    it('returns 404 when the program does not exist', async () => {
      mockLoadProgramForExport.mockResolvedValue(null);
      const { GET } = await import('@/app/api/programs/[id]/export/excel/route');

      const response = await GET(requestFor(`/api/programs/${PROGRAM_ID}/export/excel`), {
        params: Promise.resolve({ id: PROGRAM_ID }),
      });

      expect(response.status).toBe(404);
    });

    it('returns 403 for a private program owned by someone else', async () => {
      mockAuth.mockResolvedValue({ user: { id: '550e8400-e29b-41d4-a716-446655440111' } });
      const { GET } = await import('@/app/api/programs/[id]/export/excel/route');

      const response = await GET(requestFor(`/api/programs/${PROGRAM_ID}/export/excel`), {
        params: Promise.resolve({ id: PROGRAM_ID }),
      });

      expect(response.status).toBe(403);
    });

    it('returns a downloadable Excel file for the owner', async () => {
      const { GET } = await import('@/app/api/programs/[id]/export/excel/route');

      const response = await GET(requestFor(`/api/programs/${PROGRAM_ID}/export/excel`), {
        params: Promise.resolve({ id: PROGRAM_ID }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(response.headers.get('Content-Disposition')).toContain('programa_Acampamento_de_Primavera_');

      const buffer = Buffer.from(await response.arrayBuffer());
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      expect(workbook.SheetNames).toContain('Resumo');
      expect(workbook.SheetNames).toContain('Cronograma');
    });
  });

  describe('GET /api/programs/[id]/export/pdf', () => {
    it('returns 401 when the user is not authenticated', async () => {
      mockAuth.mockResolvedValue(null);
      const { GET } = await import('@/app/api/programs/[id]/export/pdf/route');

      const response = await GET(requestFor(`/api/programs/${PROGRAM_ID}/export/pdf`), {
        params: Promise.resolve({ id: PROGRAM_ID }),
      });

      expect(response.status).toBe(401);
    });

    it('returns a PDF download after rendering HTML', async () => {
      const { GET } = await import('@/app/api/programs/[id]/export/pdf/route');

      const response = await GET(requestFor(`/api/programs/${PROGRAM_ID}/export/pdf`), {
        params: Promise.resolve({ id: PROGRAM_ID }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(mockSetContent).toHaveBeenCalled();
      expect(String(mockSetContent.mock.calls[0][0])).toContain('Cronograma do Programa');
      expect(mockPdf).toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();

      const bytes = new Uint8Array(await response.arrayBuffer());
      expect(Buffer.from(bytes).toString('utf8')).toContain('%PDF-1.4');
    });

    it('returns 500 when Playwright cannot generate the PDF', async () => {
      mockLaunch.mockRejectedValue(new Error("Executable doesn't exist"));
      const { GET } = await import('@/app/api/programs/[id]/export/pdf/route');

      const response = await GET(requestFor(`/api/programs/${PROGRAM_ID}/export/pdf`), {
        params: Promise.resolve({ id: PROGRAM_ID }),
      });

      expect(response.status).toBe(500);
    });
  });
});

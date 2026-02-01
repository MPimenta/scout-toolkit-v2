import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useProgramPDFExport } from '@/hooks/useProgramPDFExport';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock URL.createObjectURL and related DOM APIs
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemove = vi.fn();

Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
});

Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => ({
    href: '',
    download: '',
    click: mockClick,
  })),
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
});

Object.defineProperty(document.body, 'remove', {
  value: mockRemove,
});

// Mock the log utility
vi.mock('@/lib/errors', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useProgramPDFExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useProgramPDFExport());

    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.exportToPDF).toBe('function');
  });

  it('should set loading state during export', async () => {
    const mockResponse = {
      ok: true,
      headers: new Headers({
        'Content-Disposition': 'attachment; filename="test.pdf"',
      }),
      blob: () => Promise.resolve(new Blob(['pdf content'])),
    };

    mockFetch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useProgramPDFExport());

    let loadingState: boolean;
    
    act(() => {
      result.current.exportToPDF('test-program-id').then(() => {
        loadingState = result.current.isLoading;
      });
    });

    // Check loading state during export
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await result.current.exportToPDF('test-program-id');
    });

    // Check loading state after export
    expect(result.current.isLoading).toBe(false);
  });

  it('should call API with correct URL', async () => {
    const mockResponse = {
      ok: true,
      headers: new Headers({
        'Content-Disposition': 'attachment; filename="test.pdf"',
      }),
      blob: () => Promise.resolve(new Blob(['pdf content'])),
    };

    mockFetch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useProgramPDFExport());

    await act(async () => {
      await result.current.exportToPDF('test-program-id');
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/programs/test-program-id/export/pdf', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/pdf',
      },
    });
  });

  it('should handle successful export', async () => {
    const mockBlob = new Blob(['pdf content']);
    const mockResponse = {
      ok: true,
      headers: new Headers({
        'Content-Disposition': 'attachment; filename="programa_test_2025-09-07.pdf"',
      }),
      blob: () => Promise.resolve(mockBlob),
    };

    mockFetch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useProgramPDFExport());

    await act(async () => {
      await result.current.exportToPDF('test-program-id');
    });

    expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(mockClick).toHaveBeenCalled();
    expect(mockRemove).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should throw error for failed API response', async () => {
    const mockResponse = {
      ok: false,
      json: () => Promise.resolve({ error: { message: 'API Error' } }),
    };

    mockFetch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useProgramPDFExport());

    await expect(
      act(async () => {
        await result.current.exportToPDF('test-program-id');
      })
    ).rejects.toThrow('API Error');
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useProgramPDFExport());

    await expect(
      act(async () => {
        await result.current.exportToPDF('test-program-id');
      })
    ).rejects.toThrow('Network error');
  });
});








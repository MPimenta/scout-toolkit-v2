import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useProgramPDFExport } from '@/hooks/useProgramPDFExport';

const mockFetch = vi.fn();
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
const mockClick = vi.fn();
const mockRemove = vi.fn();

vi.mock('@/lib/errors', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useProgramPDFExport', () => {
  const originalFetch = global.fetch;
  let clickSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
    mockCreateObjectURL.mockReturnValue('blob:mock-url');

    Object.defineProperty(window.URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: mockCreateObjectURL,
    });
    Object.defineProperty(window.URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: mockRevokeObjectURL,
    });

    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      mockClick();
    });
    removeSpy = vi.spyOn(HTMLAnchorElement.prototype, 'remove').mockImplementation(function (this: HTMLAnchorElement) {
      mockRemove();
      this.parentNode?.removeChild(this);
    });
  });

  afterEach(() => {
    clickSpy.mockRestore();
    removeSpy.mockRestore();
    global.fetch = originalFetch;
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useProgramPDFExport());

    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.exportToPDF).toBe('function');
  });

  it('should set loading state during export', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({
        'Content-Disposition': 'attachment; filename="test.pdf"',
      }),
      blob: () => Promise.resolve(new Blob(['pdf content'])),
    });

    const { result } = renderHook(() => useProgramPDFExport());

    let exportPromise: Promise<void>;
    act(() => {
      exportPromise = result.current.exportToPDF('test-program-id');
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await exportPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should call API with correct URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({
        'Content-Disposition': 'attachment; filename="test.pdf"',
      }),
      blob: () => Promise.resolve(new Blob(['pdf content'])),
    });

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
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({
        'Content-Disposition': 'attachment; filename="programa_test_2025-09-07.pdf"',
      }),
      blob: () => Promise.resolve(mockBlob),
    });

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
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'API Error' } }),
    });

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

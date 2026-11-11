import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OrgoAttendanceNote } from '@/components/features/programs/OrgoAttendanceNote';

function stubCounts(data: unknown, ok = true) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, json: async () => ({ data }) }));
}

describe('OrgoAttendanceNote', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows the confirmed and invited counts, and where attendance is checked', async () => {
    stubCounts({ invited: 15, attending: 12 });
    render(<OrgoAttendanceNote programId="p1" />);
    expect(await screen.findByText(/12 confirmados de 15 convidados/)).toBeInTheDocument();
    expect(screen.getByText(/As presenças confirmam-se no eAEP/)).toBeInTheDocument();
  });

  it('shows only the invited count when Orgo does not report who is attending', async () => {
    stubCounts({ invited: 15, attending: null });
    render(<OrgoAttendanceNote programId="p1" />);
    expect(await screen.findByText(/15 convidados/)).toBeInTheDocument();
    expect(screen.queryByText(/confirmados/)).not.toBeInTheDocument();
  });

  it('shows only the sentence when the counts are unknown or the read fails', async () => {
    stubCounts({ invited: null, attending: null });
    render(<OrgoAttendanceNote programId="p1" />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.getByTestId('orgo-attendance-note').textContent).toBe('As presenças confirmam-se no eAEP.');
  });

  it('survives a failed request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    render(<OrgoAttendanceNote programId="p1" />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.getByTestId('orgo-attendance-note').textContent).toBe('As presenças confirmam-se no eAEP.');
  });

  it('never shows names', async () => {
    stubCounts({ invited: 2, attending: 1, name: 'Ana Exemplo' });
    render(<OrgoAttendanceNote programId="p1" />);
    await screen.findByText(/1 confirmados de 2 convidados/);
    expect(screen.queryByText(/Ana Exemplo/)).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SuggestEditForm } from '@/components/features/activities/SuggestEditForm';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    if (url === '/api/taxonomies/activity-formats') {
      return { ok: true, json: async () => ({ activity_formats: [{ id: 'fmt-jogo', name: 'Jogo' }, { id: 'fmt-qg', name: 'Quebra-gelo' }] }) };
    }
    if (url === '/api/taxonomies/activity-focuses') {
      return { ok: true, json: async () => ({ activity_focuses: [{ id: 'foc-coop', name: 'Cooperação' }] }) };
    }
    return { ok: true, json: async () => ({ suggestion: {} }), init };
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SuggestEditForm', () => {
  it('offers the format and the two focuses, and no activity type', () => {
    render(<SuggestEditForm activityId="a1" />);

    const options = screen.getAllByRole('option').map((option) => option.textContent);
    expect(options).toEqual(expect.arrayContaining(['Formato', 'Foco principal', 'Foco secundário']));
    expect(options).not.toContain('activity_types');
    expect(options.join(' ')).not.toMatch(/tipo/i);
  });

  it('lets the person pick a format by name and sends its id', async () => {
    render(<SuggestEditForm activityId="a1" />);

    fireEvent.change(screen.getByLabelText('Campo'), { target: { value: 'format_id' } });
    const value = await screen.findByLabelText('Novo valor');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Quebra-gelo' })).toBeInTheDocument());
    fireEvent.change(value, { target: { value: 'fmt-qg' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar sugestão' }));

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([url]) => url === '/api/activities/a1/suggestions');
      expect(post).toBeTruthy();
      expect(JSON.parse((post![1] as RequestInit).body as string)).toEqual({ field: 'format_id', suggested_value: 'fmt-qg' });
    });
  });

  it('loads the focuses for the focus fields', async () => {
    render(<SuggestEditForm activityId="a1" />);

    fireEvent.change(screen.getByLabelText('Campo'), { target: { value: 'secondary_focus_id' } });

    await waitFor(() => expect(screen.getByRole('option', { name: 'Cooperação' })).toBeInTheDocument());
  });

  it('keeps a plain text box for the other fields', () => {
    render(<SuggestEditForm activityId="a1" />);

    expect(screen.getByPlaceholderText(/Novo valor/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Novo valor')).not.toBeInTheDocument();
  });
});

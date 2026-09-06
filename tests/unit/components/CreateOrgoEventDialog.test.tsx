import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateOrgoEventDialog } from '@/components/features/programs/CreateOrgoEventDialog';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const program = {
  id: '550e8400-e29b-41d4-a716-446655440200',
  name: 'Acampamento de Verão',
  date: '2026-07-12',
  start_time: '09:00',
  is_public: false,
};

describe('CreateOrgoEventDialog', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          units: [
            { iri: '/api/v1/units/123', name: 'Agrupamento 123' },
            { iri: '/api/v1/units/456', name: 'Agrupamento 456' },
          ],
        }),
      })
    );
  });

  it('asks for end datetime and units, not timezone or tickets', async () => {
    render(
      <CreateOrgoEventDialog
        open
        onOpenChange={vi.fn()}
        program={program}
        entries={[]}
      />
    );

    expect(screen.getByText('Criar evento no eAEP')).toBeInTheDocument();
    expect(screen.getByLabelText('Fim')).toBeInTheDocument();
    expect(screen.getByLabelText('Unidade Orgo')).toBeInTheDocument();
    expect(screen.getByLabelText('Local')).toBeInTheDocument();
    expect(screen.queryByLabelText(/fuso|timezone|preço|bilhete|ticket/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/timezone/i)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText('Unidade Orgo')).toBeEnabled();
    });
  });

  it('explains when the user has no units', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ units: [] }),
      })
    );

    render(
      <CreateOrgoEventDialog
        open
        onOpenChange={vi.fn()}
        program={program}
        entries={[]}
      />
    );

    expect(await screen.findByText('Não tem unidades Orgo onde possa criar eventos.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar no eAEP' })).toBeDisabled();
  });

  it('does not submit without a unit', async () => {
    const user = userEvent.setup();
    render(
      <CreateOrgoEventDialog
        open
        onOpenChange={vi.fn()}
        program={program}
        entries={[]}
      />
    );
    await waitFor(() => expect(screen.getByLabelText('Unidade Orgo')).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Criar no eAEP' }));
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

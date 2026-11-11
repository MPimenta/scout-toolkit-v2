import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateOrgoEventDialog } from '@/components/features/programs/CreateOrgoEventDialog';
import type { OrgoOptions } from '@/types/orgo-options';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const program = {
  id: '550e8400-e29b-41d4-a716-446655440200',
  name: 'Acampamento de Verão',
  date: '2026-07-12',
  start_time: '09:00',
  is_public: false,
};

const tree = {
  groupName: 'Grupo 312 Coimbra',
  total: 3,
  divisions: [
    { id: '3254', name: 'Tribo de Exploradores', userType: 'Explorador', count: 2 },
    { id: '3276', name: 'Chefia', userType: 'Dirigente', count: 1 },
  ],
  members: [
    { id: '1001', name: 'Ana Exemplo', cardId: '10001', divisionId: '3254' },
    { id: '1002', name: 'Rui Teste', cardId: '10002', divisionId: '3254' },
    { id: '1003', name: 'Marta Dirigente', cardId: '10003', divisionId: '3276' },
  ],
};

const baseOptions: OrgoOptions = {
  pending: false,
  stub: false,
  units: [{ iri: '/api/v1/units/3200', name: 'Grupo 312 Coimbra' }],
  groupName: 'Grupo 312 Coimbra',
  canPublish: true,
  participants: tree,
  attachment: { allowed: false, fileName: 'programa_Acampamento.pdf', reason: 'private' },
  descriptionSummary: { blocks: 3, challenges: 2 },
};

type Handler = (url: string, init?: RequestInit) => unknown;

function stubApi(options: OrgoOptions | null = baseOptions, handlers: { create?: Handler; retry?: Handler } = {}) {
  const calls: Array<{ url: string; method: string; body: unknown }> = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? 'GET';
      calls.push({ url, method, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      if (url.endsWith('/orgo/options')) {
        return { ok: true, status: 200, json: async () => ({ data: options }) };
      }
      if (url.endsWith('/orgo/retry')) {
        return { ok: true, status: 200, json: async () => handlers.retry?.(url, init) ?? { steps: {} } };
      }
      return {
        ok: true,
        status: 201,
        json: async () =>
          handlers.create?.(url, init) ?? {
            orgo_event_url: 'https://eaep.escoteiros.pt/event/evt-1',
            orgo_event_attendance_url: 'https://eaep.escoteiros.pt/events/attend/evt-1',
            steps: {},
          },
      };
    })
  );
  return calls;
}

async function openDialog(options: Partial<typeof program> = {}) {
  const user = userEvent.setup();
  render(
    <CreateOrgoEventDialog
      open
      onOpenChange={vi.fn()}
      program={{ ...program, ...options }}
      entries={[]}
    />
  );
  await waitFor(() => expect(screen.getByLabelText('Unidade Orgo')).toBeEnabled());
  return user;
}

describe('CreateOrgoEventDialog', () => {
  beforeEach(() => {
    stubApi();
  });

  it('asks for end datetime and unit, not timezone or tickets', async () => {
    await openDialog();
    expect(screen.getByText('Criar evento no eAEP')).toBeInTheDocument();
    expect(screen.getByLabelText('Fim')).toBeInTheDocument();
    expect(screen.getByLabelText('Unidade Orgo')).toBeInTheDocument();
    expect(screen.getByLabelText('Local')).toBeInTheDocument();
    expect(screen.queryByLabelText(/fuso|timezone|preço|bilhete|ticket/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/timezone/i)).not.toBeInTheDocument();
  });

  it('explains when the user has no units', async () => {
    stubApi({ ...baseOptions, units: [], participants: null, canPublish: false });
    render(<CreateOrgoEventDialog open onOpenChange={vi.fn()} program={program} entries={[]} />);
    expect(await screen.findByText('Não tens unidades Orgo onde possas criar eventos.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar no eAEP' })).toBeDisabled();
  });

  it('does not submit without a unit', async () => {
    const calls = stubApi({ ...baseOptions, units: [{ iri: '/api/v1/units/1', name: 'A' }, { iri: '/api/v1/units/2', name: 'B' }] });
    const user = await openDialog();
    await user.click(screen.getByRole('button', { name: 'Criar no eAEP' }));
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(0);
  });

  it('tells the owner who sees the event', async () => {
    await openDialog();
    expect(screen.getByText(/Quem vê este evento: os dirigentes de «Grupo 312 Coimbra»/)).toBeInTheDocument();
  });

  describe('publishing and participants', () => {
    it('warns that publishing notifies the members of the unit', async () => {
      const user = await openDialog();
      expect(screen.getByText(/O evento fica em rascunho/)).toBeInTheDocument();
      await user.click(screen.getByRole('switch', { name: 'Publicar agora' }));
      expect(screen.getByText(/os membros de «Grupo 312 Coimbra» são notificados/)).toBeInTheDocument();
    });

    it('asks to publish first before it lets the owner choose participants', async () => {
      const user = await openDialog();
      await user.click(screen.getByRole('tab', { name: /Participantes/ }));
      expect(screen.getByText(/Só é possível convidar participantes num evento publicado/)).toBeInTheDocument();
      expect(screen.queryByLabelText('Convidar Ana Exemplo')).not.toBeInTheDocument();
    });

    it('lists the group by divisão once publishing is on, with nobody selected', async () => {
      const user = await openDialog();
      await user.click(screen.getByRole('switch', { name: 'Publicar agora' }));
      await user.click(screen.getByRole('tab', { name: /Participantes/ }));

      expect(screen.getByText('A convidar: 0 de 3')).toBeInTheDocument();
      // Invited members are not emailed, so the leader is told where they will see the event.
      expect(screen.getByText(/Os convidados não recebem email: veem o evento no eAEP\./)).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Tribo de Exploradores' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Chefia' })).toBeInTheDocument();
      expect(screen.getByLabelText('Convidar Ana Exemplo')).not.toBeChecked();
      expect(screen.getByText('Nº 10001')).toBeInTheDocument();
    });

    it('selects a whole divisão, the whole group, or one member', async () => {
      const user = await openDialog();
      await user.click(screen.getByRole('switch', { name: 'Publicar agora' }));
      await user.click(screen.getByRole('tab', { name: /Participantes/ }));

      await user.click(screen.getByLabelText('Selecionar Tribo de Exploradores'));
      expect(screen.getByText('A convidar: 2 de 3')).toBeInTheDocument();
      expect(screen.getByLabelText('Convidar Ana Exemplo')).toBeChecked();
      expect(screen.getByLabelText('Convidar Marta Dirigente')).not.toBeChecked();

      await user.click(screen.getByLabelText('Selecionar todo o grupo Grupo 312 Coimbra'));
      expect(screen.getByText('A convidar: 3 de 3')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Limpar seleção' }));
      await user.click(screen.getByLabelText('Convidar Rui Teste'));
      expect(screen.getByText('A convidar: 1 de 3')).toBeInTheDocument();
    });

    it('searches by name or by card number', async () => {
      const user = await openDialog();
      await user.click(screen.getByRole('switch', { name: 'Publicar agora' }));
      await user.click(screen.getByRole('tab', { name: /Participantes/ }));

      await user.type(screen.getByLabelText('Pesquisar por nome ou nº associativo'), 'rui');
      expect(screen.queryByLabelText('Convidar Ana Exemplo')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Convidar Rui Teste')).toBeInTheDocument();

      await user.clear(screen.getByLabelText('Pesquisar por nome ou nº associativo'));
      await user.type(screen.getByLabelText('Pesquisar por nome ou nº associativo'), '10003');
      expect(screen.getByLabelText('Convidar Marta Dirigente')).toBeInTheDocument();
      expect(screen.queryByLabelText('Convidar Rui Teste')).not.toBeInTheDocument();

      await user.clear(screen.getByLabelText('Pesquisar por nome ou nº associativo'));
      await user.type(screen.getByLabelText('Pesquisar por nome ou nº associativo'), 'zzz');
      expect(screen.getByText('Nenhum membro corresponde à pesquisa.')).toBeInTheDocument();
    });

    it('"convidar todos" selects only the members that are listed', async () => {
      const user = await openDialog();
      await user.click(screen.getByRole('switch', { name: 'Publicar agora' }));
      await user.click(screen.getByRole('tab', { name: /Participantes/ }));
      await user.type(screen.getByLabelText('Pesquisar por nome ou nº associativo'), 'e');
      await user.clear(screen.getByLabelText('Pesquisar por nome ou nº associativo'));
      await user.type(screen.getByLabelText('Pesquisar por nome ou nº associativo'), 'exemplo');
      await user.click(screen.getByRole('button', { name: 'Convidar todos os listados' }));
      expect(screen.getByText('A convidar: 1 de 3')).toBeInTheDocument();
    });

    it('sends the chosen member ids, publish on, and no attachment for a private program', async () => {
      const calls = stubApi();
      const user = await openDialog();
      await user.click(screen.getByRole('switch', { name: 'Publicar agora' }));
      await user.click(screen.getByRole('tab', { name: /Participantes/ }));
      await user.click(screen.getByLabelText('Convidar Ana Exemplo'));
      await user.click(screen.getByLabelText('Convidar Marta Dirigente'));
      expect(screen.getByText('Será publicado e serão convidados 2 membros.')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Criar no eAEP' }));
      await waitFor(() => expect(calls.some((c) => c.method === 'POST')).toBe(true));
      const post = calls.find((c) => c.method === 'POST')?.body as Record<string, unknown>;
      expect(post).toMatchObject({ publish: true, attachment: false });
      expect((post['participants'] as string[]).sort()).toEqual(['1001', '1003']);
    });

    it('sends no participants when the event will stay a draft', async () => {
      const calls = stubApi();
      const user = await openDialog();
      await user.click(screen.getByRole('button', { name: 'Criar no eAEP' }));
      await waitFor(() => expect(calls.some((c) => c.method === 'POST')).toBe(true));
      expect(calls.find((c) => c.method === 'POST')?.body).toMatchObject({ publish: false, participants: [] });
    });

    it('hides the participants when the leader scope is unknown', async () => {
      stubApi({ ...baseOptions, participants: null });
      const user = await openDialog();
      await user.click(screen.getByRole('tab', { name: /Participantes/ }));
      expect(screen.getByText(/Não foi possível determinar o teu grupo/)).toBeInTheDocument();
    });

    it('explains when the role cannot publish and creates a draft', async () => {
      stubApi({ ...baseOptions, canPublish: false });
      const user = await openDialog();
      expect(screen.queryByRole('switch', { name: 'Publicar agora' })).not.toBeInTheDocument();
      expect(screen.getByText(/O teu papel não permite publicar eventos nesta unidade/)).toBeInTheDocument();
      await user.click(screen.getByRole('tab', { name: /Participantes/ }));
      expect(screen.getByText(/Não podes convidar participantes a partir daqui/)).toBeInTheDocument();
    });
  });

  describe('description and attachment', () => {
    it('summarises what the description will contain', async () => {
      const user = await openDialog();
      await user.click(screen.getByRole('tab', { name: /Descrição e anexo/ }));
      expect(screen.getByText(/Inclui o programa \(3 blocos\) e 2 desafios/)).toBeInTheDocument();
    });

    it('explains that a private program is not attached', async () => {
      const user = await openDialog();
      await user.click(screen.getByRole('tab', { name: /Descrição e anexo/ }));
      expect(screen.getByText(/Este programa é privado/)).toBeInTheDocument();
      expect(screen.queryByRole('switch', { name: /Anexar o PDF/ })).not.toBeInTheDocument();
    });

    it('offers the PDF on by default for a public program, and sends the choice', async () => {
      const calls = stubApi({
        ...baseOptions,
        attachment: { allowed: true, fileName: 'programa_Acampamento.pdf', reason: null },
      });
      const user = await openDialog({ is_public: true });
      await user.click(screen.getByRole('tab', { name: /Descrição e anexo/ }));
      const toggle = screen.getByRole('switch', { name: /Anexar o PDF do programa \(programa_Acampamento\.pdf\)/ });
      expect(toggle).toBeChecked();
      await user.click(screen.getByRole('button', { name: 'Criar no eAEP' }));
      await waitFor(() => expect(calls.some((c) => c.method === 'POST')).toBe(true));
      expect(calls.find((c) => c.method === 'POST')?.body).toMatchObject({ attachment: true });
    });
  });

  describe('after the event is created', () => {
    const createdWith = (steps: object) => ({
      orgo_event_url: 'https://eaep.escoteiros.pt/event/evt-1',
      orgo_event_attendance_url: 'https://eaep.escoteiros.pt/events/attend/evt-1',
      steps,
    });

    it('shows the success view with both links when every step worked', async () => {
      stubApi(baseOptions, {
        create: () => createdWith({ publish: { status: 'done', at: 't' } }),
      });
      const user = await openDialog();
      await user.click(screen.getByRole('button', { name: 'Criar no eAEP' }));
      expect(await screen.findByRole('heading', { name: 'Evento criado no eAEP' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Abrir evento no eAEP' })).toHaveAttribute(
        'href',
        'https://eaep.escoteiros.pt/event/evt-1'
      );
      expect(screen.getByRole('link', { name: 'Presenças no eAEP' })).toHaveAttribute(
        'href',
        'https://eaep.escoteiros.pt/events/attend/evt-1'
      );
      expect(screen.queryByRole('button', { name: /Tentar/ })).not.toBeInTheDocument();
    });

    it('shows per-step results with counts, and retries only the failed step', async () => {
      const calls = stubApi(baseOptions, {
        create: () =>
          createdWith({
            publish: { status: 'done', at: 't' },
            invitations: { status: 'failed', at: 't', requested: 2, added: 1, failed: 1, reason: '1 de 2 adicionados.' },
          }),
        retry: () => ({
          steps: {
            publish: { status: 'done', at: 't' },
            invitations: { status: 'done', at: 't2', requested: 2, added: 2, failed: 0 },
          },
        }),
      });
      const user = await openDialog();
      await user.click(screen.getByRole('switch', { name: 'Publicar agora' }));
      await user.click(screen.getByRole('tab', { name: /Participantes/ }));
      await user.click(screen.getByLabelText('Convidar Ana Exemplo'));
      await user.click(screen.getByLabelText('Convidar Rui Teste'));
      await user.click(screen.getByRole('button', { name: 'Criar no eAEP' }));

      expect(await screen.findByRole('heading', { name: 'Evento criado com avisos' })).toBeInTheDocument();
      expect(screen.getByText('Convites: 1 de 2 adicionados')).toBeInTheDocument();
      expect(screen.getByText(/repete só o passo que falhou/)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Tentar os restantes' }));
      expect(await screen.findByText('Convites: 2 de 2 adicionados')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Tentar os restantes' })).not.toBeInTheDocument();

      const retry = calls.find((c) => c.url.endsWith('/orgo/retry'));
      expect(retry?.method).toBe('POST');
      expect(retry?.body).toMatchObject({ step: 'invitations' });
      expect(((retry?.body as { participants: string[] }).participants).sort()).toEqual(['1001', '1002']);
      // The event is created only once.
      expect(calls.filter((c) => c.method === 'POST' && !c.url.endsWith('/retry'))).toHaveLength(1);
    });

    it('never shows the names of the people invited in the result', async () => {
      stubApi(baseOptions, {
        create: () =>
          createdWith({
            publish: { status: 'done', at: 't' },
            invitations: { status: 'done', at: 't', requested: 1, added: 1, failed: 0 },
          }),
      });
      const user = await openDialog();
      await user.click(screen.getByRole('switch', { name: 'Publicar agora' }));
      await user.click(screen.getByRole('tab', { name: /Participantes/ }));
      await user.click(screen.getByLabelText('Convidar Ana Exemplo'));
      await user.click(screen.getByRole('button', { name: 'Criar no eAEP' }));
      const dialog = await screen.findByRole('dialog');
      await within(dialog).findByText('Convites: 1 de 1 adicionados');
      expect(within(dialog).queryByText(/Ana Exemplo/)).not.toBeInTheDocument();
    });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockInvite = vi.fn();
const mockPublish = vi.fn();
const mockGetEvent = vi.fn();
const mockAttach = vi.fn();
const mockRender = vi.fn();
const mockLoadProgram = vi.fn();

vi.mock('@/lib/db/server', () => ({ db: {} }));
vi.mock('@/lib/orgo/client', () => ({
  OrgoRequestError: class OrgoRequestError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
  inviteOrgoUser: (...args: unknown[]) => mockInvite(...args),
  publishOrgoEvent: (...args: unknown[]) => mockPublish(...args),
  getOrgoEvent: (...args: unknown[]) => mockGetEvent(...args),
  attachFileToOrgoEvent: (...args: unknown[]) => mockAttach(...args),
}));
vi.mock('@/lib/export/pdf', () => ({ renderProgramPdf: (...args: unknown[]) => mockRender(...args) }));
vi.mock('@/lib/export/load-program', () => ({ loadProgramForExport: (...args: unknown[]) => mockLoadProgram(...args) }));

import { OrgoRequestError } from '@/lib/orgo/client';
import {
  MAX_ATTACHMENT_BYTES,
  mergeSteps,
  runAttachmentStep,
  runInvitationsStep,
  runPublishStep,
  skippedInvitations,
} from '@/lib/orgo/steps';

describe('mergeSteps', () => {
  it('keeps earlier steps and replaces the ones in the patch', () => {
    const earlier = {
      publish: { status: 'done' as const, at: 't1' },
      attachment: { status: 'failed' as const, at: 't1' },
    };
    expect(mergeSteps(earlier, { attachment: { status: 'done', at: 't2' } })).toEqual({
      publish: { status: 'done', at: 't1' },
      attachment: { status: 'done', at: 't2' },
    });
    expect(mergeSteps(null, { publish: { status: 'done', at: 't' } })).toEqual({ publish: { status: 'done', at: 't' } });
  });
});

describe('runPublishStep', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is done when Orgo publishes', async () => {
    mockPublish.mockResolvedValue(undefined);
    expect((await runPublishStep('evt', false)).status).toBe('done');
  });

  it('counts an already published event as done, so a retry cannot fail on it', async () => {
    mockPublish.mockRejectedValue(new OrgoRequestError(400, 'already published'));
    mockGetEvent.mockResolvedValue({ eventId: 1, status: 'published', hasFile: false });
    expect((await runPublishStep('evt', false)).status).toBe('done');
  });

  it('fails with a Portuguese reason when Orgo refuses', async () => {
    mockPublish.mockRejectedValue(new OrgoRequestError(403, 'no'));
    mockGetEvent.mockResolvedValue({ eventId: 1, status: 'draft', hasFile: false });
    const step = await runPublishStep('evt', false);
    expect(step.status).toBe('failed');
    expect(step.reason).toMatch(/rascunho/);
  });

  it('does not call Orgo in the e2e stub', async () => {
    expect((await runPublishStep('evt', true)).status).toBe('done');
    expect(mockPublish).not.toHaveBeenCalled();
  });
});

describe('runInvitationsStep', () => {
  beforeEach(() => vi.clearAllMocks());

  it('invites every member and counts them', async () => {
    mockInvite.mockResolvedValue('invited');
    const step = await runInvitationsStep('evt', ['1', '2', '3'], false);
    expect(step).toMatchObject({ status: 'done', requested: 3, added: 3, failed: 0 });
    expect(mockInvite).toHaveBeenCalledTimes(3);
  });

  it('counts "already attending" as added, so a repeat never double-invites or fails', async () => {
    mockInvite.mockResolvedValue('already');
    expect(await runInvitationsStep('evt', ['1', '2'], false)).toMatchObject({ status: 'done', added: 2, failed: 0 });
  });

  it('reports a partial failure as counts', async () => {
    mockInvite.mockImplementation(async (_uuid: string, id: string) => {
      if (id === '2') throw new OrgoRequestError(400, 'refused');
      return 'invited';
    });
    const step = await runInvitationsStep('evt', ['1', '2', '3'], false);
    expect(step).toMatchObject({ status: 'failed', requested: 3, added: 2, failed: 1, reason: '2 de 3 adicionados.' });
  });

  it('never keeps member ids in what it returns', async () => {
    mockInvite.mockResolvedValue('invited');
    const step = await runInvitationsStep('evt', ['424242'], false);
    expect(JSON.stringify(step)).not.toContain('424242');
  });

  it('works through a large selection with a bounded number of requests at a time', async () => {
    let running = 0;
    let peak = 0;
    mockInvite.mockImplementation(async () => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 1));
      running -= 1;
      return 'invited';
    });
    const ids = Array.from({ length: 40 }, (_, i) => String(i + 1));
    expect((await runInvitationsStep('evt', ids, false)).added).toBe(40);
    expect(peak).toBeLessThanOrEqual(5);
  });

  it('does not call Orgo in the e2e stub', async () => {
    expect(await runInvitationsStep('evt', ['1', '2'], true)).toMatchObject({ status: 'done', added: 2 });
    expect(mockInvite).not.toHaveBeenCalled();
  });

  it('builds a skipped record with the reason', () => {
    expect(skippedInvitations(4, 'depois de publicar')).toMatchObject({
      status: 'skipped',
      requested: 4,
      added: 0,
      failed: 0,
      reason: 'depois de publicar',
    });
  });
});

describe('runAttachmentStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEvent.mockResolvedValue({ eventId: 7, status: 'published', hasFile: false });
    mockLoadProgram.mockResolvedValue({ name: 'Acampamento' });
    mockRender.mockResolvedValue(Buffer.from('%PDF-1.4'));
    mockAttach.mockResolvedValue(undefined);
  });

  it('renders the PDF and attaches it to the event', async () => {
    expect((await runAttachmentStep('prog', 'evt', false)).status).toBe('done');
    expect(mockAttach).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ mimeType: 'application/pdf', name: expect.stringMatching(/\.pdf$/) })
    );
  });

  it('does not attach a second file when the event already has one', async () => {
    mockGetEvent.mockResolvedValue({ eventId: 7, status: 'published', hasFile: true });
    expect((await runAttachmentStep('prog', 'evt', false)).status).toBe('done');
    expect(mockRender).not.toHaveBeenCalled();
    expect(mockAttach).not.toHaveBeenCalled();
  });

  it('fails without attaching when the PDF is too large', async () => {
    mockRender.mockResolvedValue(Buffer.alloc(MAX_ATTACHMENT_BYTES + 1));
    const step = await runAttachmentStep('prog', 'evt', false);
    expect(step).toMatchObject({ status: 'failed', reason: expect.stringMatching(/grande/) });
    expect(mockAttach).not.toHaveBeenCalled();
  });

  it('fails with a message and keeps going when the upload throws', async () => {
    mockAttach.mockRejectedValue(new Error('storage down'));
    const step = await runAttachmentStep('prog', 'evt', false);
    expect(step).toMatchObject({ status: 'failed', reason: expect.stringMatching(/sem anexo/) });
  });

  it('fails when the event no longer exists in Orgo', async () => {
    mockGetEvent.mockResolvedValue(null);
    expect((await runAttachmentStep('prog', 'evt', false)).status).toBe('failed');
  });

  it('does nothing in the e2e stub', async () => {
    expect((await runAttachmentStep('prog', 'evt', true)).status).toBe('done');
    expect(mockRender).not.toHaveBeenCalled();
  });
});

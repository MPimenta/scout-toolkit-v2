import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { programs } from '../../../drizzle/schema';
import type { OrgoInvitationsStep, OrgoStepBase, OrgoSteps } from '@/types/orgo-steps';
import {
  OrgoRequestError,
  attachFileToOrgoEvent,
  getOrgoEvent,
  inviteOrgoUser,
  publishOrgoEvent,
} from './client';

/** Our own bound on the attachment. Orgo's storage accepts up to 1 GiB, so this is deliberately much lower. */
export const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

const INVITE_CONCURRENCY = 5;

const now = () => new Date().toISOString();

/** Merges the outcome of some steps into what was already recorded. Pure. */
export function mergeSteps(existing: OrgoSteps | null | undefined, patch: OrgoSteps): OrgoSteps {
  return { ...(existing ?? {}), ...patch };
}

export async function saveOrgoSteps(programId: string, patch: OrgoSteps): Promise<OrgoSteps> {
  const [row] = await db.select({ steps: programs.orgo_steps }).from(programs).where(eq(programs.id, programId));
  const merged = mergeSteps(row?.steps, patch);
  await db.update(programs).set({ orgo_steps: merged, updated_at: new Date() }).where(eq(programs.id, programId));
  return merged;
}

export async function runPublishStep(uuid: string, stub: boolean): Promise<OrgoStepBase> {
  if (stub) return { status: 'done', at: now() };
  try {
    await publishOrgoEvent(uuid);
    return { status: 'done', at: now() };
  } catch (error) {
    // An event that is already published counts as done, so a retry cannot fail on it.
    if (error instanceof OrgoRequestError) {
      const state = await getOrgoEvent(uuid).catch(() => null);
      if (state?.status === 'published') return { status: 'done', at: now() };
    }
    return {
      status: 'failed',
      at: now(),
      reason: 'O evento foi criado como rascunho, mas o eAEP não o publicou. Publica-o no eAEP.',
    };
  }
}

/**
 * Invites the given Orgo member ids. Ids are only counted, never kept or logged. A member
 * Orgo already has counts as added, so repeating the step never invites anyone twice.
 */
export async function runInvitationsStep(
  uuid: string,
  memberIds: string[],
  stub: boolean
): Promise<OrgoInvitationsStep> {
  let added = 0;
  let failed = 0;
  if (stub) {
    added = memberIds.length;
  } else {
    let next = 0;
    const worker = async () => {
      while (next < memberIds.length) {
        const id = memberIds[next++] as string;
        try {
          await inviteOrgoUser(uuid, id);
          added += 1;
        } catch {
          failed += 1;
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(INVITE_CONCURRENCY, memberIds.length) }, worker));
  }
  return {
    status: failed === 0 ? 'done' : 'failed',
    at: now(),
    requested: memberIds.length,
    added,
    failed,
    ...(failed > 0 ? { reason: `${added} de ${memberIds.length} adicionados.` } : {}),
  };
}

export function skippedInvitations(requested: number, reason: string): OrgoInvitationsStep {
  return { status: 'skipped', at: now(), requested, added: 0, failed: 0, reason };
}

/** Renders the program PDF and attaches it to the event, unless the event already has a file. */
export async function runAttachmentStep(
  programId: string,
  uuid: string,
  stub: boolean
): Promise<OrgoStepBase> {
  if (stub) return { status: 'done', at: now() };
  try {
    const event = await getOrgoEvent(uuid);
    if (!event) return { status: 'failed', at: now(), reason: 'O evento não foi encontrado no eAEP.' };
    if (event.hasFile) return { status: 'done', at: now() };

    // Loaded only here: the PDF renderer pulls in a whole browser library that an event
    // without an attachment never needs.
    const [{ renderProgramPdf }, { loadProgramForExport }, { buildExportFilename }] = await Promise.all([
      import('@/lib/export/pdf'),
      import('@/lib/export/load-program'),
      import('@/lib/export/labels'),
    ]);
    const program = await loadProgramForExport(programId);
    if (!program) return { status: 'failed', at: now(), reason: 'O programa não foi encontrado.' };
    const bytes = await renderProgramPdf(program);
    if (bytes.byteLength > MAX_ATTACHMENT_BYTES) {
      return { status: 'failed', at: now(), reason: 'O PDF é demasiado grande para anexar ao evento.' };
    }
    await attachFileToOrgoEvent(event.eventId, {
      name: buildExportFilename(program.name, 'pdf'),
      mimeType: 'application/pdf',
      bytes,
    });
    return { status: 'done', at: now() };
  } catch {
    return {
      status: 'failed',
      at: now(),
      reason: 'O PDF não foi anexado. O evento existe sem anexo.',
    };
  }
}

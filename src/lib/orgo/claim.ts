import { and, eq, isNull, lt, or } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { programs } from '../../../drizzle/schema';

/**
 * Value stored in programs.orgo_event_uuid while an Orgo event is being created.
 * It is never a real event: readers show "creation in progress", not a link.
 */
export const ORGO_PENDING = 'pending';

/** A claim older than this is assumed abandoned (e.g. the server died mid-create). */
export const ORGO_CLAIM_STALE_MS = 5 * 60 * 1000;

export function isOrgoPending(uuid: string | null | undefined): boolean {
  return uuid === ORGO_PENDING;
}

/**
 * Atomically marks the program as "creating in Orgo". Returns false when it already
 * has an event or another request holds a fresh claim, so at most one event is created.
 */
export async function claimProgramForOrgo(programId: string, userId: string): Promise<boolean> {
  const staleBefore = new Date(Date.now() - ORGO_CLAIM_STALE_MS);
  const claimed = await db
    .update(programs)
    .set({ orgo_event_uuid: ORGO_PENDING, updated_at: new Date() })
    .where(
      and(
        eq(programs.id, programId),
        eq(programs.user_id, userId),
        or(
          isNull(programs.orgo_event_uuid),
          and(eq(programs.orgo_event_uuid, ORGO_PENDING), lt(programs.updated_at, staleBefore))
        )
      )
    )
    .returning({ id: programs.id });
  return claimed.length === 1;
}

/** Gives the claim back after Orgo refused the create, so the owner can retry. */
export async function releaseOrgoClaim(programId: string): Promise<void> {
  await db
    .update(programs)
    .set({ orgo_event_uuid: null, orgo_event_url: null, updated_at: new Date() })
    .where(and(eq(programs.id, programId), eq(programs.orgo_event_uuid, ORGO_PENDING)));
}

/** Stores the created event, replacing the claim. */
export async function storeOrgoEvent(programId: string, uuid: string, url: string): Promise<void> {
  await db
    .update(programs)
    .set({ orgo_event_uuid: uuid, orgo_event_url: url, updated_at: new Date() })
    .where(eq(programs.id, programId));
}

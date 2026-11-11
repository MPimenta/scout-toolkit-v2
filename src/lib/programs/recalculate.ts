import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/server';
import { activities, programEntries, programs } from '../../../drizzle/schema';
import { computeSchedule, type Schedule } from './schedule';

type Database = typeof db;
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
export type DbExecutor = Database | Transaction;

type Row = {
  id: string;
  entry_type: 'activity' | 'custom';
  custom_duration_minutes: number | null;
  activity_duration_minutes: number | null;
};

/**
 * Rewrites a program's entry positions (0..n-1, keeping the current order) and the
 * stored start/end times from the shared schedule calculation. Call it inside the
 * same transaction as the write that changed the schedule.
 */
export async function recalculateProgramSchedule(
  programId: string,
  executor: DbExecutor = db
): Promise<Schedule<Row> | null> {
  const [program] = await executor
    .select({ start_time: programs.start_time })
    .from(programs)
    .where(eq(programs.id, programId));
  if (!program) return null;

  const rows = await executor
    .select({
      id: programEntries.id,
      entry_type: programEntries.entry_type,
      custom_duration_minutes: programEntries.custom_duration_minutes,
      activity_duration_minutes: activities.approximate_duration_minutes,
    })
    .from(programEntries)
    .leftJoin(activities, eq(programEntries.activity_id, activities.id))
    .where(eq(programEntries.program_id, programId))
    .orderBy(asc(programEntries.position), asc(programEntries.created_at));

  const schedule = computeSchedule(program.start_time, rows);
  for (const [position, entry] of schedule.entries.entries()) {
    await executor
      .update(programEntries)
      .set({ position, start_time: entry.start_time, end_time: entry.end_time })
      .where(eq(programEntries.id, entry.id));
  }
  return schedule;
}

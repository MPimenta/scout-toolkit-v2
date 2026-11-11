import { eq } from 'drizzle-orm';
import { applyActivityFormatsAndFocuses } from '@/lib/reference-data/activity-formats-focuses';
import { activityFocuses, activityFormats } from '../../drizzle/schema';

type Executor = Parameters<typeof applyActivityFormatsAndFocuses>[0];

/**
 * Loads the official formats and focuses and returns the ids an activity write needs:
 * format Jogo, main focus Cooperação, secondary focus Liderança. Call it after the test
 * database was reset (the reset empties these tables).
 */
export async function seedFormatAndFocus(database: Executor): Promise<{
  format_id: string;
  focus_id: string;
  secondary_focus_id: string;
}> {
  await applyActivityFormatsAndFocuses(database);
  const [format] = await database.select({ id: activityFormats.id }).from(activityFormats).where(eq(activityFormats.code, 'jogo'));
  const [focus] = await database.select({ id: activityFocuses.id }).from(activityFocuses).where(eq(activityFocuses.code, 'cooperacao'));
  const [secondary] = await database.select({ id: activityFocuses.id }).from(activityFocuses).where(eq(activityFocuses.code, 'lideranca'));
  return { format_id: format!.id, focus_id: focus!.id, secondary_focus_id: secondary!.id };
}

/** Fixed ids for unit tests that mock the database. */
export const FAKE_FORMAT_ID = '6f1c2d4e-0a1b-4c3d-8e5f-0123456789ab';
export const FAKE_FOCUS_ID = '7a2d3e5f-1b2c-4d4e-9f60-123456789abc';
export const FAKE_SECONDARY_FOCUS_ID = '8b3e4f60-2c3d-4e5f-a071-23456789abcd';

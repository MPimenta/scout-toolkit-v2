/**
 * The one schedule calculation (openspec program-builder: "Schedule starts at the
 * program start time", "One total duration everywhere"). Used by the API, exports,
 * the Orgo dialog defaults and the builder's optimistic updates.
 *
 * Entries run back to back from the program start time. An entry's length is the
 * activity's approximate duration, or the custom block's duration; an activity entry
 * whose activity was deleted counts as 0 minutes.
 */

const MINUTES_PER_DAY = 24 * 60;

export interface ScheduleEntryInput {
  entry_type: 'activity' | 'custom';
  /** The linked activity's approximate duration (null when the activity is gone). */
  activity_duration_minutes?: number | null;
  custom_duration_minutes?: number | null;
}

export type ScheduledEntry<T> = T & {
  start_time: string;
  end_time: string;
  duration_minutes: number;
};

export interface Schedule<T> {
  entries: ScheduledEntry<T>[];
  total_minutes: number;
  start_time: string;
  end_time: string;
}

/** "HH:MM" or "HH:MM:SS" → minutes after midnight. Invalid input counts as 00:00. */
export function timeToMinutes(time: string | null | undefined): number {
  const match = /^(\d{1,2}):(\d{2})/.exec(time ?? '');
  if (!match) return 0;
  return (Number(match[1]) % 24) * 60 + Number(match[2]);
}

/** Minutes after midnight → "HH:MM", wrapping past midnight. */
export function minutesToTime(minutes: number): string {
  const wrapped = ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function entryLengthMinutes(entry: ScheduleEntryInput): number {
  const raw =
    entry.entry_type === 'custom' ? entry.custom_duration_minutes : entry.activity_duration_minutes;
  return raw != null && Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 0;
}

/** Lays out entries (already in schedule order) from the program start time. */
export function computeSchedule<T extends ScheduleEntryInput>(
  programStartTime: string,
  entries: readonly T[]
): Schedule<T> {
  const start = timeToMinutes(programStartTime);
  let cursor = start;
  const scheduled = entries.map((entry) => {
    const duration = entryLengthMinutes(entry);
    const item = {
      ...entry,
      start_time: minutesToTime(cursor),
      end_time: minutesToTime(cursor + duration),
      duration_minutes: duration,
    };
    cursor += duration;
    return item;
  });
  return {
    entries: scheduled,
    total_minutes: cursor - start,
    start_time: minutesToTime(start),
    end_time: minutesToTime(cursor),
  };
}

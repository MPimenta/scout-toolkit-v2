import { describe, expect, it } from 'vitest';
import { computeSchedule, minutesToTime, timeToMinutes } from '@/lib/programs/schedule';

const activity = (minutes: number | null) => ({ entry_type: 'activity' as const, activity_duration_minutes: minutes });
const custom = (minutes: number) => ({ entry_type: 'custom' as const, custom_duration_minutes: minutes });

describe('computeSchedule', () => {
  it('starts at the program start time and runs entries back to back', () => {
    const schedule = computeSchedule('09:30', [activity(90), custom(15)]);
    expect(schedule.entries.map((e) => [e.start_time, e.end_time])).toEqual([
      ['09:30', '11:00'],
      ['11:00', '11:15'],
    ]);
    expect(schedule.total_minutes).toBe(105);
    expect(schedule.end_time).toBe('11:15');
  });

  it('accepts database time values with seconds', () => {
    expect(computeSchedule('10:00:00', [activity(90), custom(15)]).entries[1]!.end_time).toBe('11:45');
  });

  it('sums 90 + 15 + 15 to 2h', () => {
    expect(computeSchedule('09:30', [activity(90), custom(15), custom(15)]).total_minutes).toBe(120);
  });

  it('handles an empty program', () => {
    const schedule = computeSchedule('09:00', []);
    expect(schedule.entries).toEqual([]);
    expect(schedule.total_minutes).toBe(0);
    expect(schedule.end_time).toBe('09:00');
  });

  it('wraps past midnight', () => {
    const schedule = computeSchedule('23:30', [activity(45)]);
    expect(schedule.entries[0]).toMatchObject({ start_time: '23:30', end_time: '00:15' });
    expect(schedule.total_minutes).toBe(45);
  });

  it('counts an activity whose catalogue entry is gone as 0 minutes', () => {
    const schedule = computeSchedule('09:00', [activity(null), custom(30)]);
    expect(schedule.entries.map((e) => e.duration_minutes)).toEqual([0, 30]);
    expect(schedule.entries[1]!.start_time).toBe('09:00');
  });

  it('keeps the caller fields on each entry', () => {
    const [entry] = computeSchedule('09:00', [{ ...activity(20), id: 'e1' }]).entries;
    expect(entry).toMatchObject({ id: 'e1', duration_minutes: 20 });
  });
});

describe('time helpers', () => {
  it('converts both ways', () => {
    expect(timeToMinutes('09:30')).toBe(570);
    expect(minutesToTime(570)).toBe('09:30');
    expect(minutesToTime(-15)).toBe('23:45');
  });
});

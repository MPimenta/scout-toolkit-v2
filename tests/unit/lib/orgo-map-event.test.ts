import { describe, expect, it } from 'vitest';
import {
  defaultBeginDateTime,
  defaultEndDateTime,
  toOrgoEventPayload,
} from '@/lib/orgo/map-event';

const program = {
  name: 'Acampamento de Verão',
  date: '2026-07-12',
  start_time: '09:00',
  is_public: true,
  userName: 'Chefe Ana',
  entries: [
    { end_time: '10:00', activity: { name: 'Jogo' } },
    { end_time: '12:30', custom_title: 'Almoço' },
  ],
};

describe('toOrgoEventPayload', () => {
  it('maps date + start_time and last-entry end default', () => {
    expect(defaultBeginDateTime(program)).toBe('2026-07-12T09:00:00');
    expect(defaultEndDateTime(program)).toBe('2026-07-12T12:30:00');
  });

  it('defaults end to start + 1 hour when there are no entries', () => {
    expect(defaultEndDateTime({ ...program, entries: [] })).toBe('2026-07-12T10:00:00');
  });

  it('returns null begin/end defaults when the program has no date', () => {
    expect(defaultBeginDateTime({ ...program, date: null })).toBeNull();
    expect(defaultEndDateTime({ ...program, date: null })).toBeNull();
  });

  it('uses the client timezone and never enables ticketing', () => {
    const payload = toOrgoEventPayload(program, {
      dateTimeEnd: '2026-07-12T16:00:00',
      location: 'Quinta',
      unit: '/api/v1/units/123',
      publish: false,
      timezone: 'Europe/Lisbon',
    });
    expect(payload.timezone).toBe('Europe/Lisbon');
    expect(payload.hasEventTicketing).toBe(false);
    expect(payload.dateTimeBegin).toBe('2026-07-12T09:00:00');
    expect(payload.isPublic).toBe(true);
    expect(payload).not.toHaveProperty('price');
  });

  it('falls back to Europe/Lisbon when timezone is omitted', () => {
    const payload = toOrgoEventPayload(program, {
      dateTimeEnd: '2026-07-12T16:00:00',
      location: 'Quinta',
      unit: '/api/v1/units/123',
      publish: false,
    });
    expect(payload.timezone).toBe('Europe/Lisbon');
  });
});

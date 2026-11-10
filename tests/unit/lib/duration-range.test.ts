import { describe, expect, it } from 'vitest';
import { formatDuration, parseDurationRange } from '@/lib/activities/duration-range';

describe('formatDuration', () => {
  it('shows the range when there is one', () => {
    expect(formatDuration(30, 20, 40)).toBe('20–40 min');
  });

  it('shows the single duration without a range, with an incomplete range or with equal bounds', () => {
    expect(formatDuration(30)).toBe('30 min');
    expect(formatDuration(30, null, null)).toBe('30 min');
    expect(formatDuration(30, 20, null)).toBe('30 min');
    expect(formatDuration(30, 25, 25)).toBe('30 min');
  });
});

describe('parseDurationRange', () => {
  it('accepts no range, one bound or both', () => {
    expect(parseDurationRange(undefined, undefined)).toEqual({ min: null, max: null });
    expect(parseDurationRange('', '40')).toEqual({ min: null, max: 40 });
    expect(parseDurationRange(15, 15)).toEqual({ min: 15, max: 15 });
  });

  it('rejects an inverted range and anything that is not a positive whole number of minutes', () => {
    expect(parseDurationRange(40, 20)).toBe('A duração mínima não pode exceder a máxima');
    for (const bad of [0, -5, 1.5, 'abc']) expect(parseDurationRange(bad, undefined), String(bad)).toBe('Duração mínima ou máxima inválida');
  });
});

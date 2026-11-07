/**
 * Duration filter helpers. The slider works on stops; the first stop means "no minimum"
 * and the last one "no maximum". The minute fields keep whatever integer the user typed.
 */
export const DURATION_STOPS = [5, 10, 15, 20, 30, 45, 60, 90, 120] as const;
export const LAST_STOP = DURATION_STOPS.length - 1;

export type DurationBounds = { min: string; max: string };

/** Index of the stop closest to a number of minutes. */
export function nearestStop(minutes: number): number {
  let best = 0;
  let distance = Number.POSITIVE_INFINITY;
  DURATION_STOPS.forEach((stop, index) => {
    const d = Math.abs(stop - minutes);
    if (d < distance) {
      distance = d;
      best = index;
    }
  });
  return best;
}

/** Slider handle positions for the current bounds (an empty bound is an open end). */
export function boundsToIndexes({ min, max }: DurationBounds): [number, number] {
  const lo = min === '' ? 0 : nearestStop(Number(min));
  const hi = max === '' ? LAST_STOP : nearestStop(Number(max));
  return [lo, hi];
}

/** Bounds for the handle positions: the ends of the scale mean "open". */
export function indexesToBounds(lo: number, hi: number): DurationBounds {
  const [a, b] = lo <= hi ? [lo, hi] : [hi, lo];
  return {
    min: a === 0 ? '' : String(DURATION_STOPS[a]),
    max: b === LAST_STOP ? '' : String(DURATION_STOPS[b]),
  };
}

export type DurationCheck = { ok: true } | { ok: false; reason: 'not-a-number' | 'min-above-max' };

/** A bound must be a non-negative integer; the minimum may not exceed the maximum. */
export function validateDuration({ min, max }: DurationBounds): DurationCheck {
  const isInteger = (value: string) => /^\d+$/.test(value);
  if ((min !== '' && !isInteger(min)) || (max !== '' && !isInteger(max))) return { ok: false, reason: 'not-a-number' };
  if (min !== '' && max !== '' && Number(min) > Number(max)) return { ok: false, reason: 'min-above-max' };
  return { ok: true };
}

/** True when no bound limits the range (the filter is off). */
export function isFullRange({ min, max }: DurationBounds): boolean {
  return min === '' && max === '';
}

type Translate = (path: string, vars?: Record<string, string | number>) => string;

/** "15–45 min", "≤30 min", "≥60 min" or "Qualquer duração". */
export function durationReadout({ min, max }: DurationBounds, t: Translate): string {
  if (min === '' && max === '') return t('filters.durationAny');
  if (min === '') return t('filters.durationUpTo', { max });
  if (max === '') return t('filters.durationFrom', { min });
  return t('filters.durationRange', { min, max });
}

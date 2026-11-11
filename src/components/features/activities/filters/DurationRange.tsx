'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/components/locale/LocaleProvider';
import {
  DURATION_STOPS,
  LAST_STOP,
  boundsToIndexes,
  durationReadout,
  indexesToBounds,
  validateDuration,
  type DurationBounds,
} from '@/lib/activities/duration';

interface DurationRangeProps {
  min: string;
  max: string;
  onChange: (bounds: DurationBounds) => void;
}

/**
 * Duration as a range: a stepped two-handle slider (the first stop means no minimum, the last
 * no maximum) plus two minute fields that accept any whole number. Bounds are inclusive.
 */
export function DurationRange({ min, max, onChange }: DurationRangeProps) {
  const { t } = useLocale();
  const [fields, setFields] = useState<DurationBounds>({ min, max });
  const [lo, hi] = boundsToIndexes({ min, max });
  const check = validateDuration(fields);

  // Keep the fields in sync when the filter changes elsewhere (chips, clear, slider).
  useEffect(() => {
    setFields({ min, max });
  }, [min, max]);

  const moveHandle = (which: 'lo' | 'hi', index: number) => {
    const next = indexesToBounds(which === 'lo' ? index : lo, which === 'hi' ? index : hi);
    onChange(next);
  };

  const typeField = (key: 'min' | 'max', raw: string) => {
    const value = raw.trim();
    const next = { ...fields, [key]: value };
    setFields(next);
    if (validateDuration(next).ok) onChange(next);
  };

  const errorId = 'duration-error';
  const leftPct = (lo / LAST_STOP) * 100;
  const rightPct = 100 - (hi / LAST_STOP) * 100;

  return (
    <div className="space-y-2">
      <p className="text-sm font-bold text-primary" aria-live="polite" data-testid="duration-readout">
        {durationReadout(validateDuration(fields).ok ? fields : { min, max }, t)}
      </p>
      <div className="range-dual relative h-9">
        <div className="absolute inset-x-0 top-4 h-1 rounded bg-border" aria-hidden />
        <div className="absolute top-4 h-1 rounded bg-primary" style={{ left: `${leftPct}%`, right: `${rightPct}%` }} aria-hidden />
        <input
          type="range"
          min={0}
          max={LAST_STOP}
          step={1}
          value={lo}
          aria-label={t('filters.durationMinHandle')}
          aria-valuetext={lo === 0 ? t('filters.durationAny') : `${DURATION_STOPS[lo]} min`}
          onChange={(event) => moveHandle('lo', Math.min(Number(event.target.value), hi))}
          style={{ zIndex: lo >= hi ? 3 : 1 }}
        />
        <input
          type="range"
          min={0}
          max={LAST_STOP}
          step={1}
          value={hi}
          aria-label={t('filters.durationMaxHandle')}
          aria-valuetext={hi === LAST_STOP ? t('filters.durationAny') : `${DURATION_STOPS[hi]} min`}
          onChange={(event) => moveHandle('hi', Math.max(Number(event.target.value), lo))}
          style={{ zIndex: 2 }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground" aria-hidden>
        {DURATION_STOPS.map((stop, index) => (
          <span key={stop}>{index === LAST_STOP ? `${stop}+` : stop}</span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          inputMode="numeric"
          aria-label={t('filters.durationMinField')}
          aria-invalid={!check.ok}
          aria-describedby={check.ok ? undefined : errorId}
          value={fields.min}
          onChange={(event) => typeField('min', event.target.value)}
          className="w-20"
        />
        <span aria-hidden>–</span>
        <Input
          inputMode="numeric"
          aria-label={t('filters.durationMaxField')}
          aria-invalid={!check.ok}
          aria-describedby={check.ok ? undefined : errorId}
          value={fields.max}
          onChange={(event) => typeField('max', event.target.value)}
          className="w-20"
        />
        <span className="text-xs text-muted-foreground">min</span>
      </div>
      {!check.ok && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {check.reason === 'min-above-max' ? t('filters.durationOrder') : t('filters.durationNumber')}
        </p>
      )}
    </div>
  );
}

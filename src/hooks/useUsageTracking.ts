'use client';

import { useEffect, useRef } from 'react';
import { useFeature } from '@/components/providers/FeaturesProvider';
import { EMPTY_FILTERS, hasActiveFilters, type FilterState } from '@/lib/activities/filters';

/** Settle time before a search counts as one search, not one per keystroke. */
export const SEARCH_SETTLE_MS = 800;

/** Fire-and-forget: a failure to record must never reach the visitor. */
function send(body: unknown) {
  try {
    void fetch('/api/usage/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // ignore
  }
}

function searchBody(filters: FilterState, resultCount: number) {
  const { search, ...rest } = filters;
  return { type: 'search', text: search, filters: rest, result_count: resultCount };
}

/**
 * Records one `search` event once the results of a settled search have loaded. Nothing is sent
 * for an empty search, while loading, for page changes (only filters and text count), or when
 * the same search was just recorded.
 */
export function useTrackSearch(filters: FilterState, resultCount: number | undefined, loading: boolean) {
  const enabled = useFeature('usage-tracking');
  const last = useRef<string>('');

  useEffect(() => {
    if (!enabled || loading || resultCount === undefined) return;
    if (!hasActiveFilters(filters) || JSON.stringify(filters) === JSON.stringify(EMPTY_FILTERS)) {
      last.current = '';
      return;
    }
    const key = JSON.stringify(filters);
    if (key === last.current) return;
    const timer = setTimeout(() => {
      last.current = key;
      send(searchBody(filters, resultCount));
    }, SEARCH_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [enabled, loading, resultCount, filters]);
}

/** Records one `activity_view` when the detail page of an activity is shown. */
export function useTrackActivityView(activityId: string | undefined) {
  const enabled = useFeature('usage-tracking');
  const sent = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !activityId || sent.current === activityId) return;
    sent.current = activityId;
    send({ type: 'activity_view', activity_id: activityId });
  }, [enabled, activityId]);
}

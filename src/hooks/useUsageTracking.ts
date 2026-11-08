'use client';

import { useEffect, useRef } from 'react';
import { useFeature } from '@/components/providers/FeaturesProvider';
import { EMPTY_FILTERS, hasActiveFilters, type FilterState } from '@/lib/activities/filters';
import { isStandalone } from '@/lib/pwa/install';

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
export function useTrackSearch(
  filters: FilterState,
  resultCount: number | undefined,
  loading: boolean,
  /** A search restored from the session, not run by the visitor now: it is not recorded again. */
  restored: FilterState | null = null
) {
  const enabled = useFeature('usage-tracking');
  const last = useRef<string>('');
  const skippedRestored = useRef(false);

  useEffect(() => {
    if (!enabled || loading || resultCount === undefined) return;
    if (!hasActiveFilters(filters) || JSON.stringify(filters) === JSON.stringify(EMPTY_FILTERS)) {
      last.current = '';
      return;
    }
    const key = JSON.stringify(filters);
    if (key === last.current) return;
    if (restored && !skippedRestored.current && key === JSON.stringify(restored)) {
      skippedRestored.current = true;
      last.current = key;
      return;
    }
    const timer = setTimeout(() => {
      last.current = key;
      send(searchBody(filters, resultCount));
    }, SEARCH_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [enabled, loading, resultCount, filters, restored]);
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

/** Remembers, for this browsing session, that the launch was already recorded. */
export const APP_LAUNCH_KEY = 'kit-app-launch-recorded';

/**
 * Records one `app_launch` per browsing session when the app runs installed (standalone) or
 * was opened from its launch URL (`?source=pwa`, set by the manifest's start_url and
 * shortcuts). Needs both the usage-tracking and pwa flags. A reload or resume inside the
 * same session is not a new launch.
 */
export function useTrackAppLaunch() {
  const tracking = useFeature('usage-tracking');
  const pwa = useFeature('pwa');
  const enabled = tracking && pwa;

  useEffect(() => {
    if (!enabled) return;
    const fromLaunchUrl = new URLSearchParams(window.location.search).get('source') === 'pwa';
    if (!fromLaunchUrl && !isStandalone(window)) return;
    try {
      if (window.sessionStorage.getItem(APP_LAUNCH_KEY)) return;
      window.sessionStorage.setItem(APP_LAUNCH_KEY, '1');
    } catch {
      // No session storage: record once per page load rather than not at all.
    }
    send({ type: 'app_launch' });
  }, [enabled]);
}

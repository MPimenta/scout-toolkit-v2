'use client';

import { createContext, useContext, useMemo } from 'react';
import type { FeatureFlag } from '@/lib/features';

const FeaturesContext = createContext<ReadonlySet<FeatureFlag>>(new Set());

/**
 * Makes the server's enabled feature flags (FEATURES) available to client components.
 * The root layout reads them on the server and passes the list down.
 */
export function FeaturesProvider({
  enabled,
  children,
}: {
  enabled: FeatureFlag[];
  children: React.ReactNode;
}) {
  const value = useMemo(() => new Set(enabled), [enabled]);
  return <FeaturesContext.Provider value={value}>{children}</FeaturesContext.Provider>;
}

/** True when the given feature is switched on. Off by default outside the provider. */
export function useFeature(flag: FeatureFlag): boolean {
  return useContext(FeaturesContext).has(flag);
}

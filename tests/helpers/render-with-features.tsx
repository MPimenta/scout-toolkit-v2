import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { FeaturesProvider } from '@/components/providers/FeaturesProvider';
import { FEATURE_FLAGS, type FeatureFlag } from '@/lib/features';

/**
 * Renders with feature flags available (default: every flag on, like FEATURES=all).
 * Pass `features: []` to test the MVP default where every flag is off.
 */
export function renderWithFeatures(
  ui: ReactElement,
  options: RenderOptions & { features?: readonly FeatureFlag[] } = {}
) {
  const { features = FEATURE_FLAGS, ...rest } = options;
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <FeaturesProvider enabled={[...features]}>{children}</FeaturesProvider>
  );
  return render(ui, { wrapper: Wrapper, ...rest });
}

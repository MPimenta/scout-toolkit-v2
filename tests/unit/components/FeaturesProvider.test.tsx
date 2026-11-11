import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeaturesProvider, useFeature } from '@/components/providers/FeaturesProvider';

function Probe() {
  return (
    <ul>
      <li>gallery:{String(useFeature('public-programs'))}</li>
      <li>locale:{String(useFeature('english-locale'))}</li>
    </ul>
  );
}

describe('FeaturesProvider', () => {
  it('exposes the enabled flags to client components', () => {
    render(
      <FeaturesProvider enabled={['public-programs']}>
        <Probe />
      </FeaturesProvider>
    );
    expect(screen.getByText('gallery:true')).toBeInTheDocument();
    expect(screen.getByText('locale:false')).toBeInTheDocument();
  });

  it('treats every flag as off without a provider', () => {
    render(<Probe />);
    expect(screen.getByText('gallery:false')).toBeInTheDocument();
  });
});

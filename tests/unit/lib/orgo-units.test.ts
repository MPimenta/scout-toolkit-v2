import { describe, expect, it } from 'vitest';
import { filterEventCreateUnits } from '@/lib/orgo/client';

describe('filterEventCreateUnits', () => {
  it('keeps units with EVENT or ADMIN grants', () => {
    const units = filterEventCreateUnits([
      { unit: { id: 123, name: 'Agrupamento 123' }, localCenterPermission: 'EVENT_LOCAL' },
      { unit: { id: 999, name: 'Outro' }, localCenterPermission: 'USER' },
    ]);
    expect(units).toEqual([{ iri: '/api/v1/units/123', name: 'Agrupamento 123' }]);
  });

  it('falls back to membership units when no event-create grant is present', () => {
    const units = filterEventCreateUnits([
      { unit: { id: 1, name: 'Agrupamento 1' } },
      { unit: { id: 2, name: 'Agrupamento 2' } },
    ]);
    expect(units).toHaveLength(2);
  });
});

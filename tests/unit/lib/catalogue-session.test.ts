import { describe, expect, it } from 'vitest';
import { EMPTY_FILTERS } from '@/lib/activities/filters';
import {
  CATALOGUE_SESSION_KEY,
  readCatalogueSession,
  writeCatalogueSession,
} from '@/lib/activities/catalogue-session';

const store = (value: string | null) => ({ getItem: () => value });

describe('catalogue session', () => {
  it('round-trips filters, page and view', () => {
    const saved: Record<string, string> = {};
    const filters = { ...EMPTY_FILTERS, search: 'fogo', ageGroup: ['scouts', 'explorers'], durationMax: '60' };
    writeCatalogueSession({ setItem: (key, value) => void (saved[key] = value) }, { filters, page: 3, viewMode: 'table' });
    expect(Object.keys(saved)).toEqual([CATALOGUE_SESSION_KEY]);
    expect(readCatalogueSession(store(saved[CATALOGUE_SESSION_KEY]!))).toEqual({ filters, page: 3, viewMode: 'table' });
  });

  it('returns null when nothing is stored, storage is missing, or the value is not JSON', () => {
    expect(readCatalogueSession(store(null))).toBeNull();
    expect(readCatalogueSession(null)).toBeNull();
    expect(readCatalogueSession(store('not json'))).toBeNull();
    expect(readCatalogueSession(store('42'))).toBeNull();
  });

  it('repairs untrusted values instead of passing them to the catalogue', () => {
    const raw = JSON.stringify({
      filters: { search: 7, ageGroup: ['scouts', 5, null], unknown: 'x', durationMin: '15' },
      page: -2,
      viewMode: 'grid',
    });
    expect(readCatalogueSession(store(raw))).toEqual({
      filters: { ...EMPTY_FILTERS, ageGroup: ['scouts'], durationMin: '15' },
      page: 1,
      viewMode: 'tiles',
    });
  });

  it('does not throw when storage throws', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readCatalogueSession(blocked)).toBeNull();
    expect(() => writeCatalogueSession(blocked, { filters: EMPTY_FILTERS, page: 1, viewMode: 'tiles' })).not.toThrow();
  });
});

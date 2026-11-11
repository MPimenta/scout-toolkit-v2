import { EMPTY_FILTERS, type FilterState } from './filters';

/**
 * The catalogue's filters, page and view, kept for the browsing session so that coming back
 * from an activity (the in-app back control, or the system back gesture in the installed app)
 * shows the list as it was left. Session storage: it ends with the app window, and nothing is
 * kept between launches.
 */
export const CATALOGUE_SESSION_KEY = 'kit-catalogue-session';

export type CatalogueView = 'tiles' | 'table';

export interface CatalogueSession {
  filters: FilterState;
  page: number;
  viewMode: CatalogueView;
}

type Reader = Pick<Storage, 'getItem'>;
type Writer = Pick<Storage, 'setItem'>;

function normaliseFilters(value: unknown): FilterState {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const result: Record<string, string | string[]> = {};
  for (const [key, fallback] of Object.entries(EMPTY_FILTERS)) {
    const stored = source[key];
    if (Array.isArray(fallback)) {
      result[key] = Array.isArray(stored) ? stored.filter((item): item is string => typeof item === 'string') : [];
    } else {
      result[key] = typeof stored === 'string' ? stored : '';
    }
  }
  return result as unknown as FilterState;
}

/** The saved session, or null when there is none or it cannot be trusted. */
export function readCatalogueSession(storage: Reader | null): CatalogueSession | null {
  try {
    const raw = storage?.getItem(CATALOGUE_SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const { filters, page, viewMode } = parsed as Record<string, unknown>;
    return {
      filters: normaliseFilters(filters),
      page: typeof page === 'number' && Number.isInteger(page) && page >= 1 ? page : 1,
      viewMode: viewMode === 'table' ? 'table' : 'tiles',
    };
  } catch {
    return null;
  }
}

export function writeCatalogueSession(storage: Writer | null, session: CatalogueSession): void {
  try {
    storage?.setItem(CATALOGUE_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Storage blocked or full: the list simply starts fresh next time.
  }
}

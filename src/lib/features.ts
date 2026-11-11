/**
 * Feature flags for non-MVP features (openspec: feature-flags).
 *
 * `FEATURES` is a comma-separated list of enabled flags, or `all`. Unset means
 * every flag is off. Unknown names are ignored. When a flag is off its UI is
 * hidden and its routes answer 404 (see `FEATURE_ROUTES` and middleware.ts);
 * data is never deleted.
 */
export const FEATURE_FLAGS = [
  'english-locale',
  'public-programs',
  'activity-proposals',
  'edit-suggestions',
  'review-discussion',
  'activities-table-view',
  'admin-taxonomies',
  'api-docs',
  'issue-reports',
  'usage-tracking',
  'pwa',
] as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[number];

const KNOWN = new Set<string>(FEATURE_FLAGS);

/** Parses a FEATURES value into the set of enabled flags. */
export function parseFeatures(value: string | undefined | null): Set<FeatureFlag> {
  const names = (value ?? '')
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);
  if (names.includes('all')) return new Set(FEATURE_FLAGS);
  return new Set(names.filter((name): name is FeatureFlag => KNOWN.has(name)));
}

/** Enabled flags for this process. Read at call time so env changes and test stubs apply. */
export function getEnabledFeatures(): Set<FeatureFlag> {
  return parseFeatures(process.env['FEATURES']);
}

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return getEnabledFeatures().has(flag);
}

/**
 * Paths owned by a flag. `*` matches one path segment; a pattern matches the path
 * itself and anything below it. Method-specific cases (e.g. POST /api/activities,
 * a member proposal, next to the public GET catalogue) are guarded in their handlers.
 */
export const FEATURE_ROUTES: ReadonlyArray<{ pattern: string; flag: FeatureFlag }> = [
  // public-programs
  { pattern: '/programs/public', flag: 'public-programs' },
  { pattern: '/api/programs/public', flag: 'public-programs' },
  // activity-proposals
  { pattern: '/atividades/propor', flag: 'activity-proposals' },
  { pattern: '/atividades/minhas', flag: 'activity-proposals' },
  { pattern: '/api/activities/mine', flag: 'activity-proposals' },
  // edit-suggestions (+ notifications, which only carry suggestion and report events)
  { pattern: '/api/activities/*/suggestions', flag: 'edit-suggestions' },
  { pattern: '/api/admin/suggestions', flag: 'edit-suggestions' },
  { pattern: '/admin/sugestoes', flag: 'edit-suggestions' },
  { pattern: '/api/notifications', flag: 'edit-suggestions' },
  // review-discussion (votes, reactions, replies; the star rating itself stays)
  { pattern: '/api/activities/*/ratings/*/vote', flag: 'review-discussion' },
  { pattern: '/api/activities/*/ratings/*/reactions', flag: 'review-discussion' },
  { pattern: '/api/activities/*/ratings/*/replies', flag: 'review-discussion' },
  // admin-taxonomies (public read-only taxonomy lists stay for the filters)
  { pattern: '/admin/taxonomias', flag: 'admin-taxonomies' },
  { pattern: '/api/admin/taxonomies', flag: 'admin-taxonomies' },
  // api-docs
  { pattern: '/api/docs', flag: 'api-docs' },
  { pattern: '/api/docs.json', flag: 'api-docs' },
  { pattern: '/api/metrics', flag: 'api-docs' },
  // issue-reports
  { pattern: '/api/reports', flag: 'issue-reports' },
  { pattern: '/api/admin/reports', flag: 'issue-reports' },
  { pattern: '/admin/reportes', flag: 'issue-reports' },
  // usage-tracking
  { pattern: '/api/usage', flag: 'usage-tracking' },
  { pattern: '/api/admin/usage', flag: 'usage-tracking' },
  { pattern: '/admin/utilizacao', flag: 'usage-tracking' },
  // pwa (the offline page and /sw.js stay always on so a switched-off flag can retire the worker)
  { pattern: '/manifest.webmanifest', flag: 'pwa' },
];

function segments(path: string): string[] {
  return path.split('?')[0]!.split('/').filter(Boolean);
}

export function matchesRoutePattern(pattern: string, pathname: string): boolean {
  const want = segments(pattern);
  const have = segments(pathname);
  if (have.length < want.length) return false;
  return want.every((segment, i) => segment === '*' || segment === have[i]);
}

/** The flag that owns this path, or null when the path is always available. */
export function featureForPath(pathname: string): FeatureFlag | null {
  return FEATURE_ROUTES.find((route) => matchesRoutePattern(route.pattern, pathname))?.flag ?? null;
}

/** True when the path belongs to a feature that is currently off. */
export function isPathHidden(pathname: string, enabled: Set<FeatureFlag> = getEnabledFeatures()): boolean {
  const flag = featureForPath(pathname);
  return flag !== null && !enabled.has(flag);
}

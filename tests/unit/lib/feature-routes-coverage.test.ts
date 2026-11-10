import { describe, expect, it } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { featureForPath } from '@/lib/features';

/**
 * Every page and API route must be classified: either a flag in FEATURE_ROUTES owns it,
 * or it is listed here as always available (MVP or infrastructure). A new route that is
 * neither makes this test fail, so a hidden feature cannot grow an unguarded route.
 */
const ALWAYS_ON = new Set([
  '/',
  '/about',
  '/privacy',
  '/home',
  '/test',
  '/auth/signin',
  '/auth/error',
  '/activities',
  '/activities/x',
  '/programs',
  '/programs/x',
  '/programs/x/edit',
  '/admin',
  '/admin/atividades',
  '/admin/atividades/x',
  '/admin/atividades/nova',
  '/admin/utilizadores',
  '/api/auth/x',
  '/api/e2e/session',
  '/api/health',
  // pwa: reachable whatever the flag says, so a switched-off flag can retire the worker.
  '/offline',
  '/sw.js',
  '/api/uploads/activity-image',
  '/media/activity-images/x',
  // GET is the public catalogue; POST (a member proposal) is guarded in the handler.
  '/api/activities',
  '/api/activities/x',
  '/api/activities/x/ratings',
  '/api/admin/activities',
  '/api/admin/activities/x',
  '/api/admin/stats',
  '/api/admin/users',
  '/api/admin/users/x',
  '/api/programs',
  '/api/programs/x',
  '/api/programs/x/entries',
  '/api/programs/x/export/excel',
  '/api/programs/x/export/pdf',
  '/api/programs/x/orgo',
  '/api/taxonomies/activity-types',
  '/api/taxonomies/activity-formats',
  '/api/taxonomies/activity-focuses',
  '/api/taxonomies/educational-areas',
  '/api/taxonomies/educational-goals',
  '/api/taxonomies/sdgs',
  '/api/taxonomies/challenges',
  '/api/taxonomies/activity-sources',
]);

const APP_DIR = join(process.cwd(), 'src', 'app');

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return routeFiles(full);
    return /^(page|route)\.tsx?$/.test(name) ? [full] : [];
  });
}

function urlPath(file: string): string {
  const parts = relative(APP_DIR, file).split(sep).slice(0, -1);
  const segments = parts
    .filter((p) => !/^\(.*\)$/.test(p)) // route groups do not appear in the URL
    .map((p) => (/^\[.*\]$/.test(p) ? 'x' : p));
  return '/' + segments.join('/');
}

describe('FEATURE_ROUTES coverage', () => {
  it('classifies every page and API route', () => {
    const unclassified = routeFiles(APP_DIR)
      .map(urlPath)
      .filter((path) => featureForPath(path) === null && !ALWAYS_ON.has(path));
    expect(unclassified).toEqual([]);
  });
});

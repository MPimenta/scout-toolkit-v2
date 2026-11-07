import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FEATURE_FLAGS,
  featureForPath,
  isFeatureEnabled,
  isPathHidden,
  parseFeatures,
} from '@/lib/features';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('parseFeatures', () => {
  it('turns every flag off when unset or empty', () => {
    expect(parseFeatures(undefined).size).toBe(0);
    expect(parseFeatures('').size).toBe(0);
  });

  it('enables only the listed flag', () => {
    expect([...parseFeatures('public-programs')]).toEqual(['public-programs']);
  });

  it('enables every flag with "all"', () => {
    const enabled = parseFeatures('all');
    expect(enabled.size).toBe(FEATURE_FLAGS.length);
    expect([...enabled].sort()).toEqual([...FEATURE_FLAGS].sort());
  });

  it('ignores unknown names, spaces and case', () => {
    expect([...parseFeatures(' Public-Programs , nonsense,, review-discussion ')].sort()).toEqual([
      'public-programs',
      'review-discussion',
    ]);
  });

  it('reads FEATURES at call time', () => {
    vi.stubEnv('FEATURES', 'issue-reports');
    expect(isFeatureEnabled('issue-reports')).toBe(true);
    expect(isFeatureEnabled('english-locale')).toBe(false);
  });
});

describe('featureForPath', () => {
  it.each([
    ['/programs/public', 'public-programs'],
    ['/programs/public/123', 'public-programs'],
    ['/api/programs/public/123/copy', 'public-programs'],
    ['/atividades/propor', 'activity-proposals'],
    ['/api/activities/mine', 'activity-proposals'],
    ['/api/activities/abc/suggestions', 'edit-suggestions'],
    ['/api/notifications/9', 'edit-suggestions'],
    ['/admin/sugestoes', 'edit-suggestions'],
    ['/api/activities/abc/ratings/r1/vote', 'review-discussion'],
    ['/api/activities/abc/ratings/r1/replies/x/reactions', 'review-discussion'],
    ['/admin/taxonomias', 'admin-taxonomies'],
    ['/api/admin/taxonomies/sdgs', 'admin-taxonomies'],
    ['/api/docs', 'api-docs'],
    ['/api/docs.json', 'api-docs'],
    ['/api/metrics', 'api-docs'],
    ['/api/reports', 'issue-reports'],
    ['/admin/reportes', 'issue-reports'],
  ])('%s belongs to %s', (path, flag) => {
    expect(featureForPath(path)).toBe(flag);
  });

  it.each([
    '/',
    '/home',
    '/activities',
    '/activities/abc',
    '/api/activities',
    '/api/activities/abc',
    '/api/activities/abc/ratings',
    '/programs',
    '/programs/550e8400-e29b-41d4-a716-446655440000',
    '/api/programs/abc/orgo',
    '/api/taxonomies/sdgs',
    '/api/health',
    '/admin',
    '/admin/atividades',
    '/admin/utilizadores',
  ])('%s is always available', (path) => {
    expect(featureForPath(path)).toBeNull();
  });
});

describe('isPathHidden', () => {
  it('hides a flagged path when its flag is off and shows it when on', () => {
    expect(isPathHidden('/programs/public', parseFeatures(''))).toBe(true);
    expect(isPathHidden('/programs/public', parseFeatures('public-programs'))).toBe(false);
    expect(isPathHidden('/programs', parseFeatures(''))).toBe(false);
  });
});

describe('pwa flag', () => {
  it('is off when FEATURES is unset and on with FEATURES=pwa', () => {
    vi.stubEnv('FEATURES', '');
    expect(isFeatureEnabled('pwa')).toBe(false);
    vi.stubEnv('FEATURES', 'pwa');
    expect(isFeatureEnabled('pwa')).toBe(true);
  });

  it('owns the manifest route', () => {
    expect(featureForPath('/manifest.webmanifest')).toBe('pwa');
    expect(isPathHidden('/manifest.webmanifest', new Set())).toBe(true);
  });
});

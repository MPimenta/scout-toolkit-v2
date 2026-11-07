import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { featureGate, HIDDEN_FEATURE_PAGE } from '@/lib/feature-gate';
import { FEATURE_ROUTES, parseFeatures } from '@/lib/features';

const request = (path: string) => new NextRequest(`http://localhost:3000${path}`);
const concrete = (pattern: string) => pattern.replace(/\*/g, 'x');

describe('featureGate', () => {
  it.each(FEATURE_ROUTES.map((r) => [concrete(r.pattern), r.flag] as const))(
    '%s answers 404 while %s is off',
    async (path, flag) => {
      const response = featureGate(request(path), parseFeatures(''));
      expect(response).not.toBeNull();
      if (path.startsWith('/api/')) {
        expect(response!.status).toBe(404);
        expect(await response!.json()).toEqual({
          error: { code: 'NOT_FOUND', message: 'Recurso não encontrado' },
        });
      } else {
        expect(response!.headers.get('x-middleware-rewrite')).toContain(HIDDEN_FEATURE_PAGE);
      }
      // ...and passes through once the flag is on
      expect(featureGate(request(path), parseFeatures(flag))).toBeNull();
    }
  );

  it('lets MVP routes through with every flag off', () => {
    for (const path of ['/home', '/activities', '/api/activities', '/programs', '/api/programs/abc/orgo', '/admin']) {
      expect(featureGate(request(path), parseFeatures(''))).toBeNull();
    }
  });
});

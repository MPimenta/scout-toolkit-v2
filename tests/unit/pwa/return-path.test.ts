import { describe, expect, it } from 'vitest';
import { safeReturnPath } from '@/lib/pwa/return-path';

describe('safeReturnPath', () => {
  it('keeps same-origin paths with their query', () => {
    expect(safeReturnPath('/activities?q=fogo&division=lobitos')).toBe('/activities?q=fogo&division=lobitos');
  });

  it.each([null, undefined, '', 'activities', '//evil.example', '/' + String.fromCharCode(92) + 'evil.example','https://evil.example', '/offline', '/offline?from=%2Fx'])(
    'falls back to /home for %j',
    (value) => {
      expect(safeReturnPath(value)).toBe('/home');
    }
  );
});

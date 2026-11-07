import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  PWA_BACKGROUND_COLOR,
  PWA_DARK_THEME_COLOR,
  PWA_THEME_COLOR,
  buildManifest,
} from '@/lib/pwa/manifest';
import { GET } from '@/app/manifest.webmanifest/route';
import { featureForPath } from '@/lib/features';

const css = readFileSync(join(process.cwd(), 'src', 'app', 'globals.css'), 'utf8');

/** Reads `--name: H S% L%` from the :root block (light) or the .dark block. */
function tokenHex(name: string, scope: ':root' | '.dark'): string {
  const block = css.slice(css.indexOf(scope + ' {'));
  const match = block.match(new RegExp(String.raw`--${name}:\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%`));
  if (!match) throw new Error(`token --${name} not found in ${scope}`);
  const h = Number(match[1]);
  const s = Number(match[2]) / 100;
  const l = Number(match[3]) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}

/** Tokens are rounded HSL, so allow a couple of units per channel against the hex literal. */
function expectCloseHex(actual: string, expected: string) {
  const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [a, e] = [channels(actual), channels(expected)];
  a.forEach((value, i) => expect(Math.abs(value - e[i]!)).toBeLessThanOrEqual(2));
}

afterEach(() => vi.unstubAllEnvs());

describe('buildManifest', () => {
  const manifest = buildManifest();

  it('declares an installable standalone app', () => {
    expect(manifest).toMatchObject({
      name: 'Kit de Atividades',
      id: '/',
      scope: '/',
      display: 'standalone',
      lang: 'pt',
      start_url: '/home?source=pwa',
    });
    expect(manifest.short_name!.length).toBeLessThanOrEqual(15);
  });

  it('lists 192, 512 and maskable 512 icons that exist on disk', () => {
    const icons = manifest.icons ?? [];
    expect(icons.map((i) => `${i.sizes}:${i.purpose}`)).toEqual([
      '192x192:any',
      '512x512:any',
      '512x512:maskable',
    ]);
    for (const icon of icons) {
      expect(existsSync(join(process.cwd(), 'public', icon.src))).toBe(true);
    }
  });

  it('tags every launch URL with source=pwa, on routes that are always available', () => {
    const launchUrls = [manifest.start_url!, ...(manifest.shortcuts ?? []).map((s) => s.url)];
    for (const launch of launchUrls) {
      const url = new URL(launch, 'https://kit.test');
      expect(url.searchParams.get('source')).toBe('pwa');
      expect(featureForPath(url.pathname)).toBeNull();
    }
  });

  it('offers shortcuts to Atividades and Programas', () => {
    expect(manifest.shortcuts?.map((s) => s.name)).toEqual(['Atividades', 'Programas']);
  });

  it('keeps colours in step with the globals.css tokens', () => {
    expect(manifest.theme_color).toBe(PWA_THEME_COLOR);
    expectCloseHex(PWA_THEME_COLOR, tokenHex('primary', ':root'));
    expect(manifest.background_color).toBe(PWA_BACKGROUND_COLOR);
    expectCloseHex(PWA_BACKGROUND_COLOR, tokenHex('background', ':root'));
    expectCloseHex(PWA_DARK_THEME_COLOR, tokenHex('background', '.dark'));
  });
});

describe('GET /manifest.webmanifest', () => {
  it('answers 404 when the pwa flag is off', async () => {
    vi.stubEnv('FEATURES', '');
    expect(GET().status).toBe(404);
  });

  it('serves the manifest when the flag is on', async () => {
    vi.stubEnv('FEATURES', 'pwa');
    const res = GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/manifest+json');
    expect((await res.json()).name).toBe('Kit de Atividades');
  });
});

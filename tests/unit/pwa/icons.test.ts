import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import sharp from 'sharp';

/**
 * iOS paints transparent icon pixels black, which showed as a black border on the
 * home-screen icon (openspec: mobile-pwa, task 4.5). Every app icon must be fully opaque.
 */
const ICONS: Array<[string, number]> = [
  ['public/brand/pwa/icon-192.png', 192],
  ['public/brand/pwa/icon-512.png', 512],
  ['public/brand/pwa/icon-maskable-512.png', 512],
  ['src/app/apple-icon.png', 180],
];

describe('app icons', () => {
  it.each(ICONS)('%s is %i px square with no transparent pixel', async (file, size) => {
    const image = sharp(join(process.cwd(), file));
    const meta = await image.metadata();
    expect([meta.width, meta.height]).toEqual([size, size]);

    const { data } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] !== 255) transparent++;
    expect(transparent).toBe(0);
  });

  it.each(ICONS)('%s has the primary colour at its corners', async (file, size) => {
    const { data } = await sharp(join(process.cwd(), file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const pixel = (x: number, y: number) => [...data.subarray((y * size + x) * 4, (y * size + x) * 4 + 3)];
    for (const [x, y] of [[0, 0], [size - 1, 0], [0, size - 1], [size - 1, size - 1]] as const) {
      const [r, g, b] = pixel(x, y);
      expect([r, g, b]).toEqual([21, 70, 151]); // --primary, #154697
    }
  });
});

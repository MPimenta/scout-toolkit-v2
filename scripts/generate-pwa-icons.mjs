/**
 * Generates the PWA icons in public/brand/pwa/ from the existing AEP mark
 * (public/brand/favicon.png). Raster only; no colours beyond the mark and the
 * primary token (#154697). Run: node scripts/generate-pwa-icons.mjs
 *
 * - icon-192.png / icon-512.png: the mark as is, trimmed of its transparent margin.
 * - icon-maskable-512.png: full-bleed primary background with the ring centred well
 *   inside the maskable safe zone (a circle of 80% of the width).
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'public', 'brand', 'favicon.png');
const outDir = join(root, 'public', 'brand', 'pwa');
const PRIMARY = '#154697';

await mkdir(outDir, { recursive: true });

const trimmed = await sharp(source).trim().toBuffer();

for (const size of [192, 512]) {
  await sharp(trimmed)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(join(outDir, `icon-${size}.png`));
}

// Inner region of the mark: all blue plus the ring, clear of the rounded corners.
const { width = 0, height = 0 } = await sharp(trimmed).metadata();
const inset = Math.round(Math.min(width, height) * 0.08);
await sharp(trimmed)
  .extract({ left: inset, top: inset, width: width - 2 * inset, height: height - 2 * inset })
  .resize(512, 512, { fit: 'cover' })
  .flatten({ background: PRIMARY })
  .png()
  .toFile(join(outDir, 'icon-maskable-512.png'));

console.log('PWA icons written to', outDir);

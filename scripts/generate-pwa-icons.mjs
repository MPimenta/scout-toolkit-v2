/**
 * Generates the app icons from the existing AEP mark (public/brand/favicon.png).
 * Raster only; no colours beyond the mark and the primary token (#154697).
 * Run: node scripts/generate-pwa-icons.mjs
 *
 * Every icon is OPAQUE and full-bleed: the mark's rounded square sits on a transparent
 * margin, and iOS fills transparent pixels with black (a black border on the home-screen
 * icon). Platforms apply their own corner mask (iOS rounded corners, Android maskable),
 * so the artwork is the blue field plus the ring, well inside the maskable safe zone
 * (a circle of 80% of the width).
 *
 *  - public/brand/pwa/icon-192.png, icon-512.png, icon-maskable-512.png
 *  - src/app/apple-icon.png (180x180; Next.js links it as the Apple touch icon)
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

// Inner region of the mark: all blue plus the ring, clear of the rounded corners.
const { width = 0, height = 0 } = await sharp(trimmed).metadata();
const inset = Math.round(Math.min(width, height) * 0.08);
const master = await sharp(trimmed)
  .extract({ left: inset, top: inset, width: width - 2 * inset, height: height - 2 * inset })
  .resize(512, 512, { fit: 'cover' })
  .flatten({ background: PRIMARY })
  .removeAlpha()
  .png()
  .toBuffer();

const targets = [
  [join(outDir, 'icon-512.png'), 512],
  [join(outDir, 'icon-maskable-512.png'), 512],
  [join(outDir, 'icon-192.png'), 192],
  [join(root, 'src', 'app', 'apple-icon.png'), 180],
];
for (const [file, size] of targets) {
  await sharp(master).resize(size, size).removeAlpha().png().toFile(file);
}

console.log('Icons written:', targets.map(([file]) => file).join(', '));

// Makes the app icon and launch-screen pictures from the website's own logo
// (assets/img/icon-512.png and logo.png), so the app always matches the site.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const img = join(here, '..', '..', 'assets', 'img');
const out = join(here, '..', 'assets');
await mkdir(out, { recursive: true });

const CREAM = { r: 246, g: 240, b: 228 };

// The logo mark on a transparent background (the cream behind it is removed).
async function markOnly() {
  const { data, info } = await sharp(join(img, 'icon-512.png')).resize(1024, 1024, { kernel: 'lanczos3' })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const d = Math.abs(data[i] - CREAM.r) + Math.abs(data[i + 1] - CREAM.g) + Math.abs(data[i + 2] - CREAM.b);
    if (d < 18) data[i + 3] = 0;
    else if (d < 60) data[i + 3] = Math.round(255 * (d - 18) / 42);
  }
  return sharp(data, { raw: info }).png().trim({ threshold: 1 }).toBuffer();
}

async function place(art, size, height, background) {
  const piece = await sharp(art).resize({ height: Math.round(height) }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: piece, gravity: 'center' }]).png();
}

const mark = await markOnly();
await (await place(mark, 1024, 1024 * 0.70, { r: 0, g: 0, b: 0, alpha: 0 })).toFile(join(out, 'icon-foreground.png'));
await (await place(mark, 1024, 1024 * 0.70, { ...CREAM, alpha: 1 })).flatten({ background: CREAM }).toFile(join(out, 'icon-only.png'));
await sharp({ create: { width: 1024, height: 1024, channels: 3, background: CREAM } }).png().toFile(join(out, 'icon-background.png'));
const logo = await sharp(join(img, 'logo.png')).ensureAlpha().png().toBuffer();
await (await place(logo, 2732, 900, { r: 243, g: 236, b: 224, alpha: 1 })).flatten({ background: { r: 243, g: 236, b: 224 } }).toFile(join(out, 'splash.png'));
await (await place(mark, 2732, 620, { r: 17, g: 12, b: 11, alpha: 1 })).flatten({ background: { r: 17, g: 12, b: 11 } }).toFile(join(out, 'splash-dark.png'));
console.log('✓ App icon and launch screen pictures made from the site logo');

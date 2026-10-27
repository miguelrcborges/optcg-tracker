import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const icon = await readFile('public/icon.svg');
const maskable = await readFile('public/icon-maskable.svg');

await sharp(icon).resize(192, 192).png().toFile('public/pwa-192x192.png');
await sharp(icon).resize(512, 512).png().toFile('public/pwa-512x512.png');
await sharp(maskable).resize(512, 512).png().toFile('public/pwa-maskable-512x512.png');
await sharp(icon).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(icon).resize(64, 64).png().toFile('public/favicon-64.png');

console.log('Generated PWA icons.');

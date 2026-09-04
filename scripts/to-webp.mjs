// Usage: node scripts/to-webp.mjs <in.png> <out.webp> [maxWidth=1600]
import sharp from 'sharp';

const [, , input, output, maxWidth = '1600'] = process.argv;
if (!input || !output) {
  console.error('usage: to-webp.mjs <in.png> <out.webp> [maxWidth]');
  process.exit(1);
}
await sharp(input)
  .resize({ width: Number(maxWidth), withoutEnlargement: true })
  .webp({ quality: 82 })
  .toFile(output);
console.log(`wrote ${output}`);

// Usage: node scripts/redact.mjs <in.png> <out.png> x,y,w,h [x,y,w,h ...]
// Each rectangle is replaced by a heavily blurred copy of itself.
import sharp from 'sharp';

const [, , input, output, ...rects] = process.argv;
if (!input || !output || rects.length === 0) {
  console.error('usage: redact.mjs <in> <out> x,y,w,h [...]');
  process.exit(1);
}
const overlays = await Promise.all(
  rects.map(async (rect) => {
    const [left, top, width, height] = rect.split(',').map(Number);
    const blurred = await sharp(input).extract({ left, top, width, height }).blur(25).toBuffer();
    return { input: blurred, left, top };
  }),
);
await sharp(input).composite(overlays).toFile(output);
console.log(`wrote ${output}`);

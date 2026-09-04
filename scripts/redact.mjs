// Usage: node scripts/redact.mjs <in.png> <out.png> x,y,w,h [x,y,w,h ...]
// Each rectangle is replaced by a heavily blurred copy of itself.
import sharp from 'sharp';

const usage = 'usage: redact.mjs <in> <out> x,y,w,h [...]  (four non-negative integers per rect)';
const [, , input, output, ...rects] = process.argv;
if (!input || !output || rects.length === 0) {
  console.error(usage);
  process.exit(1);
}

// sharp turns a malformed rect into an opaque libvips error ("bad extract area") or,
// worse, silently blurs the wrong part of the picture. Reject it here instead.
const isDimension = (n) => Number.isInteger(n) && n >= 0;
const parsed = rects.map((rect) => rect.split(',').map(Number));
if (!parsed.every((r) => r.length === 4 && r.every(isDimension))) {
  console.error(usage);
  process.exit(1);
}

const overlays = await Promise.all(
  parsed.map(async ([left, top, width, height]) => {
    const blurred = await sharp(input).extract({ left, top, width, height }).blur(25).toBuffer();
    return { input: blurred, left, top };
  }),
);
await sharp(input).composite(overlays).toFile(output);
console.log(`wrote ${output}`);

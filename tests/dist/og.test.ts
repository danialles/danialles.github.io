import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { DIST, caseFrontmatters, exists } from './helpers';

const slugs = ['home', 'cv', ...caseFrontmatters().filter((c) => !c.draft).map((c) => c.slug)];

describe('OG images', () => {
  it.each(slugs)('og/%s.png is a 1200×630 PNG', async (slug) => {
    const path = `og/${slug}.png`;
    expect(exists(path), path).toBe(true);
    const meta = await sharp(resolve(DIST, path)).metadata();
    expect([meta.format, meta.width, meta.height]).toEqual(['png', 1200, 630]);
  });
});

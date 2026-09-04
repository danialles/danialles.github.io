import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DIST, exists } from './helpers';

describe('resume.pdf', () => {
  it('exists and is a single-page PDF', () => {
    expect(exists('resume.pdf')).toBe(true);
    const bytes = readFileSync(resolve(DIST, 'resume.pdf'));
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    const pages = bytes.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? [];
    expect(pages.length).toBe(1);
  });
});

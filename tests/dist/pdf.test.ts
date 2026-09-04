import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DIST, exists } from './helpers';

// The named file is what /cv links to; resume.pdf is the stable path kept for older links.
describe.each(['Daniil_Eskov_CV.pdf', 'resume.pdf'])('%s', (name) => {
  it('exists and is a single-page PDF', () => {
    expect(exists(name), name).toBe(true);
    const bytes = readFileSync(resolve(DIST, name));
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    const pages = bytes.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? [];
    expect(pages.length).toBe(1);
  });
});

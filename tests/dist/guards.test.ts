import { describe, expect, it } from 'vitest';
import { allHtmlFiles, read } from './helpers';

// Words that must never reach the published HTML (spec §2, §4, §6).
const FORBIDDEN: Array<[string, RegExp]> = [
  ['brand of the anonymous case', /mainexperts/i],
  ['CMS name hidden by positioning', /october\s*cms|\boctober\b/i],
  ['raw PHP leaked from a client site', /<\?php/],
  ['unfilled site.config value', /USERNAME/],
];

describe('published HTML', () => {
  const files = allHtmlFiles();

  it('has pages to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(FORBIDDEN)('never contains %s', (_label, pattern) => {
    const offenders = files.filter((f) => pattern.test(read(f)));
    expect(offenders).toEqual([]);
  });
});

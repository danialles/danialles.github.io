import { describe, expect, it } from 'vitest';
import { allHtmlFiles, html, read } from './helpers';
import { FORBIDDEN } from '../forbidden';

describe('published HTML', () => {
  const files = allHtmlFiles();

  it('has pages to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(FORBIDDEN)('never contains %s', (_label, pattern) => {
    const offenders = files.filter((f) => pattern.test(read(f)));
    expect(offenders).toEqual([]);
  });

  // Owner's rule: the site must not point at any GitHub profile, so that the résumé
  // and a personal account cannot be linked in either direction.
  it('never links to github.com', () => {
    const offenders = files.filter((f) => /github\.com\//i.test(read(f)));
    expect(offenders).toEqual([]);
  });
});

describe('site config', () => {
  // A half-filled site.config.mjs still builds and looks fine — the missing contacts
  // simply do not render. This test is the tripwire for that silence.
  const $ = html('index.html');

  it('is complete', () => {
    expect($('#contacts [data-contact]').length).toBe(3);
    expect($('#contacts [data-location]').text().trim().length).toBeGreaterThan(0);
  });
});

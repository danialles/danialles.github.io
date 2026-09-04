import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DIST, caseFrontmatters, exists, html } from './helpers';

const published = caseFrontmatters().filter((c) => !c.draft);
const drafts = caseFrontmatters().filter((c) => c.draft);

describe('case pages', () => {
  it.each(published)('$slug is built with the three sections', ({ slug, title, url, nda }) => {
    const path = `cases/${slug}/index.html`;
    expect(exists(path), path).toBe(true);
    const $ = html(path);
    expect($('h1').first().text()).toBe(title);
    const h2 = $('.case-body h2').map((_, el) => $(el).text().trim()).get();
    expect(h2).toEqual(['Задача', 'Что сделал', 'Результат']);
    if (url) expect($(`a[href="${url}"]`).length).toBeGreaterThan(0);
    if (nda) {
      expect($('main').text()).toContain('под NDA');
    } else {
      expect($('main').text()).not.toContain('под NDA');
    }
  });

  it.each(drafts)('$slug is a draft and is not built', ({ slug }) => {
    expect(exists(`cases/${slug}/index.html`)).toBe(false);
  });

  // Unconditional, unlike `it.each(drafts)` above which registers zero cases while no draft exists.
  it('builds exactly the published cases and no drafts', () => {
    const dirs = readdirSync(resolve(DIST, 'cases'), { withFileTypes: true }).filter((d) => d.isDirectory());
    expect(dirs.length).toBe(published.length);
  });
});
